import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ShowHelper } from 'src/app/models/models';

@Component({
  selector: 'app-helper',
  templateUrl: './helper.component.html',
  styleUrls: ['./helper.component.scss'],
})
export class HelperComponent implements OnInit {
  showHelper!: ShowHelper;
  text = '';

  constructor(private modalController: ModalController) {}

  close() {
    this.modalController.dismiss();
  }

  ngOnInit() {
    switch (this.showHelper) {
      case ShowHelper.DASHBOARD:
        this.text = `<i><h2 class="title-tuto">Bienvenue sur dyspo! ton calendrier social...</h2></p> 

        <p>Une app permettant de rester en contact avec son réseau d’amis, sa famille, etc.. et de proposer des moments de rencontres durant son temps libre.</p>

        <p>Créez facilement un événement de groupe ou un événement personnel.</p>

        <p>Changez votre statut du jour en cliquant dessus.</p>

        <p>Consultez d’un coup d’oeil les prochains événements à venir.</p>

        <p>Les notifications permettent de voir les événements auxquels vous avez été conviés afin de valider ou non votre présence.</p></i>`;
        break;
      case ShowHelper.AGENDA:
        this.text = `<i><h2 class="title-tuto">Première connexion à votre calendrier</h2>
  
      
        <p>La petite pastille orange à côté d’une date prévient qu’il y a un événement de groupe ou perso ce jour là.</p>
        
        <p>Cliquez sur une date pour en savoir + ou pour y créer un événement.</p>
        
        <p>Vous pouvez visualiser d’un coup d’oeil les vacances associées à votre zone (si vous avez renseigné votre zone lors de la création).</p>
        
        <p><u>En mode édition (en haut à droite) :</u></p>
        
        <p>Vous pouvez changer de statut en cliquant sur une date (une fois dyspo!, 2 fois dyspo avec kid(s) et 3 fois si pas dyspo du tout).</p>
        
        <p>Sélectionnez plusieurs jours d’un coup et attribuez le statut en une seule fois directement.</p></i>`;
        break;
      case ShowHelper.FRIENDS:
        this.text = `<i><h2 class="title-tuto">Première connexion à vos amis</h2>

        <p>Recherchez un contact déjà présent sur dyspo! ou dans votre répertoire.</p>
        
        <p>Organisez vos groupes comme vous le souhaitez, faites des groupes d’amis, de parents d’école, avec les membres de votre famille, etc...</p>
        
        <p>Acceptez les demandes d’amis en cours.</p>
        
        <p>Visualisez les calendriers de vos amis en cliquant sur le picto calendrier associé à leurs comptes.</p></i>
        `;
        break;
      case ShowHelper.CHATS:
        this.text = `<i><h2 class="title-tuto">Première connexion aux discussions</h2>

        <p>Vous retrouverez ici les conversations ouvertes automatiquement pour les événements de groupe.</p>
        
        <p>Une couleur par type d’événement Kid(s), NoKid(s) ou au choix.</p>
        
        <p>Une fois l’événement passé, la discussion associée basculera automatiquement dans les archives.</p></i>`;
        break;
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
