import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  constructor() {}

  logDebug(message?: any, ...optionalParams: any[]) {
    if (environment.debug) {
      console.log(message, optionalParams);
      //iOS
      // console.log(message);
      // if (optionalParams) console.log(optionalParams[0]);
    }
  }

  sendLog(message: string, func: string) {
    console.error(func, message);
    // FirebaseCrashlytics.send
  }
}
