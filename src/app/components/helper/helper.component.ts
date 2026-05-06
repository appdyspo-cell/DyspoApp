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
        icon: 'radio-button-on-outline',
        title: 'Statut du jour',
        description: 'Changez votre disponibilité d\'un simple appui sur le statut affiché en haut de l\'écran.',
      },
      {
        icon: 'calendar-outline',
        title: 'Événements à venir',
        description: 'Consultez d\'un coup d\'œil vos prochains événements personnels et de groupe.',
      },
      {
        icon: 'add-circle-outline',
        title: 'Créer un événement',
        description: 'Créez facilement un rendez-vous personnel ou invitez vos amis à un événement commun.',
      },
      {
        icon: 'notifications-outline',
        title: 'Invitations',
        description: 'Recevez une notification quand vous êtes invité à un événement et validez ou déclinez votre présence.',
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
        description: 'Acceptez ou déclinez les demandes d\'amis reçues directement depuis cette page.',
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
