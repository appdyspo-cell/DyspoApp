import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  constructor(private firestore: Firestore) {}

  logDebug(message?: any, ...optionalParams: any[]) {
    if (environment.debug) {
      console.log(message, optionalParams);
      //iOS
      // console.log(message);
      // if (optionalParams) console.log(optionalParams[0]);
    }
  }

  sendError(error: Error, func: string, uid: string) {
    console.log('Send error');
    setDoc(doc(this.firestore, `log_errors/`, 'log_' + new Date().getTime()), {
      msg: error.message,
      user_id: uid,
      name: error.name,
      stack: error.stack,
      func,
    })
      .then(() => {
        //this.utils.showToastSuccess("L'événement a été sauvegardé");
        return true;
      })
      .catch((err) => {
        //this.utils.showToastError("Une erreur s'est produite");
        return false;
      });
  }

  sendLog(msg: string, func: string, uid: string) {
    console.log('Send log');
    setDoc(doc(this.firestore, `log_debug/`, 'log_' + new Date().getTime()), {
      msg,
      func,
      user_id: uid,
    })
      .then(() => {
        //this.utils.showToastSuccess("L'événement a été sauvegardé");
        return true;
      })
      .catch((err) => {
        //this.utils.showToastError("Une erreur s'est produite");
        return false;
      });
  }

  sendUncaughtError(
    msg: any,
    url: any,
    lineNo: any,
    columnNo: any,
    error: any,
    uid: any
  ) {
    console.error('Send uncaught Erorr ', msg);

    setDoc(
      doc(
        this.firestore,
        `log_uncaught_errors/`,
        'error_' + new Date().getTime()
      ),
      {
        msg,
        user_id: uid,
        url,
        lineNo,
        columnNo,
      }
    )
      .then(() => {
        //this.utils.showToastSuccess("L'événement a été sauvegardé");
        return true;
      })
      .catch((err) => {
        //this.utils.showToastError("Une erreur s'est produite");
        return false;
      });
  }

  sendDebugData(payload: any) {
    setDoc(
      doc(this.firestore, `log_debug_data/`, 'data_' + new Date().getTime()),
      {
        msg: payload.msg,
        user_id: payload.user_id,
        //dataString: payload.dataString,
        data: payload.data,
      }
    );
  }
}
