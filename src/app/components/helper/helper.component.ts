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

  ngOnInit() {
    switch (this.showHelper) {
      case ShowHelper.DASHBOARD:
        this.text = `<h2>Bienvenue dans Dyspo !</h2> Ceci est votre premiere connexion au dashboard.

        <p>Lorem Ipsum est</p>
        Lorem Ipsum est simplement du faux texte employé dans la composition et la
        mise en page avant impression. Le Lorem Ipsum est le faux texte standard de
        l'imprimerie depuis les années 1500, quand un imprimeur anonyme assembla
        ensemble des morceaux de texte pour réaliser un livre spécimen de polices de
        texte. Il n'a pas fait que survivre cinq siècles, mais s'est aussi adapté à
        la bureautique informatique, sans que son contenu n'en soit modifié. Il a
        été popularisé dans les années 1960 grâce à la vente de feuilles Letraset
        contenant des passages du Lorem Ipsum, et, plus récemment, par son inclusion
        dans des applications de mise en page de texte, comme Aldus PageMaker.`;
        break;
      case ShowHelper.AGENDA:
        this.text = `<h2>Bienvenue dans Dyspo !</h2> Ceci est votre premiere connexion a la page Agenda.
  
          <p>Lorem Ipsum est</p>
          Lorem Ipsum est simplement du faux texte employé dans la composition et la
          mise en page avant impression. Le Lorem Ipsum est le faux texte standard de
          l'imprimerie depuis les années 1500, quand un imprimeur anonyme assembla
          ensemble des morceaux de texte pour réaliser un livre spécimen de polices de
          texte. Il n'a pas fait que survivre cinq siècles, mais s'est aussi adapté à
          la bureautique informatique, sans que son contenu n'en soit modifié. Il a
          été popularisé dans les années 1960 grâce à la vente de feuilles Letraset
          contenant des passages du Lorem Ipsum, et, plus récemment, par son inclusion
          dans des applications de mise en page de texte, comme Aldus PageMaker.`;
        break;
      case ShowHelper.FRIENDS:
        this.text = `<h2>Bienvenue dans Dyspo !</h2> Ceci est votre premiere connexion a la page friends.
  
          <p>Lorem Ipsum est</p>
          Lorem Ipsum est simplement du faux texte employé dans la composition et la
          mise en page avant impression. Le Lorem Ipsum est le faux texte standard de
          l'imprimerie depuis les années 1500, quand un imprimeur anonyme assembla
          ensemble des morceaux de texte pour réaliser un livre spécimen de polices de
          texte. Il n'a pas fait que survivre cinq siècles, mais s'est aussi adapté à
          la bureautique informatique, sans que son contenu n'en soit modifié. Il a
          été popularisé dans les années 1960 grâce à la vente de feuilles Letraset
          contenant des passages du Lorem Ipsum, et, plus récemment, par son inclusion
          dans des applications de mise en page de texte, comme Aldus PageMaker.`;
        break;
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
