import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ShowHelper } from 'src/app/models/models';

export interface HelperTip {
  icon: string;
  title: string;
  description: string;
}

export interface HelperContent {
  icon: string;
  title: string;
  subtitle: string;
  tips: HelperTip[];
}

const HELPER_CONTENTS: Record<ShowHelper, HelperContent> = {
  [ShowHelper.DASHBOARD]: {
    icon: 'home-outline',
    title: 'Bienvenue sur dyspo !',
    subtitle: 'Votre calendrier social',
    tips: [
      {
        icon: 'notifications-outline',
        title: 'Invitations',
        description: 'Recevez une notification quand vous êtes invité à un événement et validez ou déclinez votre présence.',
      },
      {
        icon: 'radio-button-on-outline',
        title: 'Statut du jour',
        description: 'Changez votre disponibilité d\'un simple appui sur le statut affiché en haut de l\'écran.',
      },
      {
        icon: 'add-circle-outline',
        title: 'Créer un événement',
        description: 'Créez facilement un rendez-vous personnel ou invitez vos amis à un événement commun.',
      },
      {
        icon: 'calendar-outline',
        title: 'Événements à venir',
        description: 'Consultez d\'un coup d\'œil vos prochains événements personnels et de groupe.',
      },
    ],
  },
  [ShowHelper.AGENDA]: {
    icon: 'calendar-outline',
    title: 'Votre calendrier',
    subtitle: 'Disponibilités et événements',
    tips: [
      {
        icon: 'finger-print-outline',
        title: 'Consulter un jour',
        description: 'Appuyez sur une date pour afficher les événements du jour dans la liste en dessous.',
      },
      {
        icon: 'add-circle-outline',
        title: 'Créer un événement',
        description: 'Sélectionnez une date future puis appuyez sur « + nouveau ». Choisissez entre rendez-vous personnel ou événement avec vos amis.',
      },
      {
        icon: 'create-outline',
        title: 'Modifier vos disponibilités',
        description: 'Activez le toggle « Modifier » en haut à droite.\n1 appui → Dyspo\n2 appuis → Dyspo avec kid(s)\n3 appuis → Pas dyspo\n4 appuis → réinitialisé\nTouchez plusieurs jours d\'affilée puis appuyez sur « Sauvegarder ».',
      },
      {
        icon: 'chatbubbles-outline',
        title: 'Chat de groupe',
        description: 'Sur les événements à plusieurs, l\'icône bulle ouvre directement la conversation du groupe.',
      },
    ],
  },
  [ShowHelper.FRIENDS]: {
    icon: 'people-outline',
    title: 'Vos amis',
    subtitle: 'Gérez votre réseau',
    tips: [
      {
        icon: 'search-outline',
        title: 'Trouver des amis',
        description: 'Recherchez un contact déjà présent sur dyspo ! ou importez directement depuis votre répertoire téléphonique.',
      },
      {
        icon: 'people-circle-outline',
        title: 'Groupes d\'amis',
        description: 'Organisez vos contacts en groupes : famille, parents d\'école, collègues… pour retrouver rapidement les bonnes personnes.',
      },
      {
        icon: 'person-add-outline',
        title: 'Demandes en attente',
        description: 'Acceptez ou déclinez les demandes d\'amis reçues ici et dans vos notifications.',
      },
      {
        icon: 'calendar-outline',
        title: 'Calendrier d\'un ami',
        description: 'Consultez les disponibilités d\'un ami en appuyant sur l\'icône calendrier à côté de son nom.',
      },
    ],
  },
  [ShowHelper.CHATS]: {
    icon: 'chatbubbles-outline',
    title: 'Discussions',
    subtitle: 'Vos conversations de groupe',
    tips: [
      {
        icon: 'flash-outline',
        title: 'Ouverture automatique',
        description: 'Chaque événement de groupe crée automatiquement une conversation dédiée accessible ici.',
      },
      {
        icon: 'color-palette-outline',
        title: 'Couleurs par type',
        description: 'Chaque couleur correspond à un type d\'événement : Kid(s), NoKid(s) ou libre, pour repérer d\'un coup d\'œil vos discussions.',
      },
      {
        icon: 'archive-outline',
        title: 'Archives',
        description: 'Une fois l\'événement passé, la discussion bascule automatiquement dans les archives pour garder votre liste propre.',
      },
    ],
  },
  [ShowHelper.PROFILE]: {
    icon: 'person-circle-outline',
    title: 'Votre profil',
    subtitle: 'Vos informations personnelles',
    tips: [
      {
        icon: 'camera-outline',
        title: 'Photo de profil',
        description: 'Appuyez sur votre avatar pour prendre ou choisir une nouvelle photo de profil.',
      },
      {
        icon: 'people-outline',
        title: 'J\'ai des enfants',
        description: 'Activez ce réglage pour indiquer votre planning de garde sur 2 semaines, utilisé pour préremplir votre calendrier.',
      },
      {
        icon: 'call-outline',
        title: 'Coordonnées',
        description: 'Votre téléphone et votre zone géographique aident vos amis à vous identifier et à connaître votre académie scolaire.',
      },
    ],
  },
  [ShowHelper.SETTINGS]: {
    icon: 'settings-outline',
    title: 'Paramètres',
    subtitle: 'Personnalisez votre expérience',
    tips: [
      {
        icon: 'notifications-outline',
        title: 'Notifications',
        description: 'Choisissez précisément quelles notifications vous souhaitez recevoir (invitations, messages, demandes d\'ami…).',
      },
      {
        icon: 'document-text-outline',
        title: 'Mentions légales',
        description: 'Retrouvez à tout moment les CGU et la politique de confidentialité de l\'application.',
      },
      {
        icon: 'trash-outline',
        title: 'Gestion du compte',
        description: 'Déconnexion ou suppression définitive de votre compte, directement depuis cette page.',
      },
    ],
  },
  [ShowHelper.CREATE_EVENT]: {
    icon: 'add-circle-outline',
    title: 'Créer un événement',
    subtitle: 'Planifiez en quelques étapes',
    tips: [
      {
        icon: 'people-circle-outline',
        title: 'Disponibilité de vos amis',
        description: 'Voyez qui de vos amis est Dyspo ! en un clin d\'œil grâce aux bulles de couleur sur leur photo.',
      },
      {
        icon: 'people-outline',
        title: 'Participants',
        description: 'Ajoutez vos amis à l\'événement : ils recevront une invitation à accepter ou décliner.',
      },
      {
        icon: 'color-palette-outline',
        title: 'Type d\'événement',
        description: 'Kid(s), NoKid(s) ou libre — ce type détermine la couleur de l\'événement dans le calendrier et la discussion associée.',
      },
      {
        icon: 'location-outline',
        title: 'Lieu',
        description: 'Renseignez une adresse pour la retrouver facilement et la partager avec les participants.',
      },
    ],
  },
  [ShowHelper.GROUP_CHAT]: {
    icon: 'chatbubbles-outline',
    title: 'Conversation de groupe',
    subtitle: 'Échangez avec les participants',
    tips: [
      {
        icon: 'heart-outline',
        title: 'Réagir à un message',
        description: 'Double-tapez un message pour lui envoyer un cœur.',
      },
      {
        icon: 'person-add-outline',
        title: 'Participant non-ami',
        description: 'Le « + » sur la photo d\'un participant que vous ne connaissez pas ouvre sa fiche et permet de lui envoyer une demande d\'ami.',
      },
      {
        icon: 'flag-outline',
        title: 'Signaler',
        description: 'Un message ou un comportement inapproprié ? Signalez-le directement depuis le menu de la conversation.',
      },
    ],
  },
};

@Component({
    selector: 'app-helper',
    templateUrl: './helper.component.html',
    styleUrls: ['./helper.component.scss'],
    standalone: false
})
export class HelperComponent implements OnInit {
  showHelper!: ShowHelper;
  content!: HelperContent;

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.content = HELPER_CONTENTS[this.showHelper];
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
