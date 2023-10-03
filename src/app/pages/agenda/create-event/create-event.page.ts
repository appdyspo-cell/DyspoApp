import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonDatetime, NavController } from '@ionic/angular';
import { add, format, formatISO, parseISO, setMinutes } from 'date-fns';


@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.page.html',
  styleUrls: ['./create-event.page.scss'],
})
export class CreateEventPage implements OnInit {
  
  eventForm: FormGroup;
  defaultTime_ISO: string;
  startTimeValue: any;
  endTimeValue: any;
  datetime_starttime_value: any;
  datetime_endtime_value: any;
  defaultTime_ISO_end: string;

  constructor(private formBuilder: FormBuilder, private navCtrl: NavController) {
    this.eventForm = this.formBuilder.group({
      title: ['', Validators.required],
     
    });
    this.defaultTime_ISO = formatISO(
      setMinutes(add(new Date(), { hours: 1 }), 0)
    );
    this.defaultTime_ISO_end = formatISO(
      setMinutes(add(new Date(), { hours: 2 }), 0)
    );

    this.datetime_starttime_value = this.defaultTime_ISO;
    this.datetime_endtime_value = this.defaultTime_ISO_end;
    console.log('default Time', this.defaultTime_ISO_end);
    
  }

  ngOnInit() {
   
  }

  createEvent() {
    console.log(this.eventForm)
    if (this.eventForm.valid) {
      // Récupérez les valeurs du formulaire ici
      const title = this.eventForm.value.title;
      const startTime = this.datetime_starttime_value;
      const endTime = this.datetime_endtime_value;

      // Effectuez l'enregistrement de l'événement ou toute autre action requise
      console.log('Événement créé :', title, startTime, endTime);

      // Réinitialisez le formulaire après la création de l'événement
      this.eventForm.reset();
      this.navCtrl.pop();
    }
  }

  onStartTimeChanged(ev: any){
    this.startTimeValue = this.formatTime(ev.detail.value);
    this.datetime_starttime_value = ev.detail.value;
  }

  onEndTimeChanged(ev: any){
    this.endTimeValue = this.formatTime(ev.detail.value);
    this.datetime_endtime_value = ev.detail.value;
  }

  formatDate(value: string) {
    console.log(parseISO(value));
    const dateTime = parseISO(value).getTime();
    console.log(dateTime);
    return format(parseISO(value), 'dd MMM yyyy');
  }

  formatTime(value: string) {
    console.log(value);
    return format(parseISO(value), 'HH:mm');
  }
}
