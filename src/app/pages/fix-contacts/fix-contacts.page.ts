import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Contacts } from '@capacitor-community/contacts';
import { Share } from '@capacitor/share';
import { Platform } from '@ionic/angular';
import { AppDeviceContact } from 'src/app/models/models';
import { FriendsService } from 'src/app/services/friends.service';
import { LoggerService } from 'src/app/services/logger.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';
import { environment } from 'src/environments/environment';

type ContactGroup = { letter: string; contacts: AppDeviceContact[] };

/**
 * Marqueur posé pendant le chargement de la page. S'il est encore présent à
 * l'ouverture suivante, c'est que la WebView a planté pendant le chargement
 * (iOS la recharge alors sur la même page → boucle de plantages). On n'enchaîne
 * pas un nouveau chargement automatique dans ce cas.
 */
const LOADING_MARKER_KEY = 'dyspo_contacts_page_loading';
const LOADING_MARKER_MAX_AGE_MS = 2 * 60 * 1000;

@Component({
    selector: 'app-fix-contacts',
    templateUrl: './fix-contacts.page.html',
    styleUrls: ['./fix-contacts.page.scss'],
    standalone: false
})
export class FixContactsPage implements AfterViewInit, OnDestroy {
  @ViewChildren('groupEl', { read: ElementRef }) groupEls!: QueryList<ElementRef<HTMLElement>>;

  appContacts: AppDeviceContact[] = [];
  appContactsGrouped: ContactGroup[] = [];
  /** Groupes réellement affichés (ajoutés progressivement pour ne pas bloquer l'UI) */
  renderedGroups: ContactGroup[] = [];
  scroll = false;
  /** true si la permission contacts a été refusée */
  permissionDenied = false;
  /** true si la page a planté au chargement précédent */
  crashRecovery = false;
  colors = [
    '#a2b9bc',
    '#6b5b95',
    '#feb236',
    '#d64161',
    '#ff7b25',
    '#b2ad7f',
    '#878f99',
  ];

  inputSearch = '';
  autocompleteItems: AppDeviceContact[] = [];

  private renderTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(
    private userSvc: UserService,
    private utils: UtilsService,
    private friendsSvc: FriendsService,
    private logger: LoggerService,
    private platform: Platform,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    if (this.readLoadingMarker()) {
      this.clearLoadingMarker();
      this.crashRecovery = true;
      this.logger.sendError(
        new Error('Contacts page crashed during previous load'),
        'fixContactsCrashRecovery',
        this.userSvc.userInfo?.uid!
      );
      this.cdr.detectChanges();
      return;
    }
    this.loadContacts();
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.stopRendering();
    this.clearLoadingMarker();
  }

  /** Bouton « Réessayer » après un plantage */
  retryAfterCrash() {
    this.crashRecovery = false;
    this.cdr.detectChanges();
    this.loadContacts();
  }

  private async loadContacts() {
    this.setLoadingMarker();
    try {
      // ── 1. Permission contacts (mobile uniquement) ─────────────────────────
      if (this.platform.is('ios') || this.platform.is('android')) {
        const perm = await Contacts.requestPermissions();
        if (perm.contacts !== 'granted') {
          this.permissionDenied = true;
          this.clearLoadingMarker();
          this.cdr.detectChanges();
          return;
        }
        this.permissionDenied = false;
      }

      // ── 2. Chargement des contacts du téléphone ────────────────────────────
      // Si déjà en cache (chargé au démarrage), on affiche immédiatement.
      // Sinon on montre un loader le temps de lire le répertoire.
      const alreadyCached = this.friendsSvc.appContacts.length > 0;
      if (!alreadyCached) {
        await this.utils.showLoader();
        try {
          await this.friendsSvc.initContacts();
        } catch (contactsErr: any) {
          console.error('[FixContacts] initContacts threw:', contactsErr);
          this.logger.sendError(contactsErr, 'initContacts', this.userSvc.userInfo?.uid!);
        } finally {
          this.utils.hideLoader();
        }
      }
      if (this.destroyed) return;

      this.appContactsGrouped = this.friendsSvc.appContactsGrouped;
      this.appContacts = this.friendsSvc.appContacts;
      console.log(`[FixContacts] ${this.appContacts.length} contact(s), ${this.appContactsGrouped.length} groupe(s)`);

      // ── 3. Affichage progressif avec les données en cache ─────────────────
      this.cdr.detectChanges();
      const rendering = this.renderGroups(this.appContactsGrouped);

      // ── 4. Hydratation Firestore, en parallèle de l'affichage ─────────────
      // Les logos Dyspo apparaissent lot par lot. Si is_member est déjà connu
      // (hydratation faite lors d'une visite précédente), on ne re-requête pas.
      const alreadyHydrated = this.appContacts.length > 0 &&
        this.appContacts.every(c => c.is_member !== undefined);

      if (!alreadyHydrated) {
        try {
          await this.userSvc.hydrateAppContacts(this.appContacts, () => this.refreshMembers());
        } catch (hydrateErr) {
          console.error('hydrateAppContacts failed, affichage sans statut membre :', hydrateErr);
        }
      }
      await rendering;
      this.refreshMembers();

    } catch (err: any) {
      console.error(err);
      this.logger.sendError(
        err,
        'fetchContactsData',
        this.userSvc.userInfo?.uid!
      );
    } finally {
      this.clearLoadingMarker();
    }
  }

  /** Met à jour le statut « déjà ami » et rafraîchit l'écran (appelé après chaque lot) */
  private refreshMembers() {
    if (this.destroyed) return;
    this.appContacts.forEach((contact) => {
      if (contact.uid) contact.is_my_friend = this.friendsSvc.isMyFriend(contact.uid);
    });
    this.cdr.detectChanges();
  }

  /** Appelé depuis le bouton "Autoriser" quand la permission est refusée */
  async requestPermissionAndReload() {
    if (!(this.platform.is('ios') || this.platform.is('android'))) return;
    const perm = await Contacts.requestPermissions();
    if (perm.contacts === 'granted') {
      this.permissionDenied = false;
      this.stopRendering();
      this.renderedGroups = [];
      this.appContacts = [];
      this.appContactsGrouped = [];
      this.cdr.detectChanges();
      await this.friendsSvc.initContacts();
      this.appContactsGrouped = this.friendsSvc.appContactsGrouped;
      this.appContacts = this.friendsSvc.appContacts;
      this.cdr.detectChanges();
      await this.renderGroups(this.appContactsGrouped);
    } else {
      this.utils.showToastError(
        'Autorise l\'accès aux contacts dans Paramètres → Applications → Dyspo → Autorisations'
      );
    }
  }

  scrollToLetter(letter: string) {
    const index = this.renderedGroups.findIndex((group) => group.letter === letter);
    if (index < 0) return;
    this.groupEls.get(index)?.nativeElement.scrollIntoView();
  }

  letterScrollActive(active: boolean) {
    this.scroll = active;
  }

  updateSearchResults() {
    const pattern = this.inputSearch;
    if (pattern === '') {
      this.autocompleteItems = [];
      return;
    } else if (pattern && pattern.length > 2) {
      this.autocompleteItems = this.appContacts.filter(
        (user) =>
          user.display!.toUpperCase().indexOf(pattern.toUpperCase()) >= 0
      );
    }
  }

  clearAutocomplete() {
    this.autocompleteItems = [];
    this.inputSearch = '';
  }

  async confirmFriendInvitation(contact: AppDeviceContact) {
    if (contact.is_my_friend) {
      this.utils.showToastError('Vous êtes déjà ami avec ' + contact.display);
      return;
    }
    if (contact.is_member) {
      contact.is_my_friend = true;
      this.friendsSvc.inviteFromDeviceContact(contact, true);
    } else {
      this.shareApp();
    }
  }

  async shareApp() {
    await Share.share({
      text: "Rejoins moi sur dyspo! Installe l'application dyspo!, crée un compte et n'oublie pas de me demander en ami.",

      url: environment.stores_url,
    });
  }

  trackByLetter(_: number, group: ContactGroup) {
    return group.letter;
  }

  trackByContact(_: number, contact: AppDeviceContact) {
    return contact.contactId || contact.phone_number;
  }

  /** Ajoute les groupes à l'écran par petits lots pour garder l'UI fluide */
  private renderGroups(groups: ContactGroup[]): Promise<void> {
    const GROUPS_PER_BATCH = 4;
    const INTERVAL_IN_MS = 40;
    this.stopRendering();
    this.renderedGroups = [];

    return new Promise((resolve) => {
      let index = 0;
      const step = () => {
        if (this.destroyed) {
          resolve();
          return;
        }
        this.renderedGroups = this.renderedGroups.concat(
          groups.slice(index, index + GROUPS_PER_BATCH)
        );
        index += GROUPS_PER_BATCH;
        this.cdr.detectChanges();
        if (index < groups.length) {
          this.renderTimer = setTimeout(step, INTERVAL_IN_MS);
        } else {
          this.renderTimer = null;
          resolve();
        }
      };
      step();
    });
  }

  private stopRendering() {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
      this.renderTimer = null;
    }
  }

  private readLoadingMarker(): boolean {
    try {
      const value = Number(localStorage.getItem(LOADING_MARKER_KEY));
      return !!value && Date.now() - value < LOADING_MARKER_MAX_AGE_MS;
    } catch {
      return false;
    }
  }

  private setLoadingMarker() {
    try {
      localStorage.setItem(LOADING_MARKER_KEY, String(Date.now()));
    } catch {}
  }

  private clearLoadingMarker() {
    try {
      localStorage.removeItem(LOADING_MARKER_KEY);
    } catch {}
  }
}
