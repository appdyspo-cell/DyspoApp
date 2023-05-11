export interface AppUser {
  id: string;
  email?: string;
  uid?: string;
  firstname?: string;
  lastname?: string;
  gender?: string;
  phoneNumber?: string;
  avatarPath?: string;
  appSettings?: AppSettings;
  status: UserStatus;
  last_connexion_ms?: number;
  last_connexion_ISO?: string;
  firstConnexion?: boolean;
  notificationToken?: string;
  isConnected?: boolean;
  friendStatus?: string;
  friendListDocId?: string;
  tagline: string;
  avg_rates?: number;
  nb_rates?: number;
  created_at_ms?: number;
  is_phoneVerified?: boolean;
  stripe_account_id?: string;
}

export interface AppSettings {
  receiveEmail: boolean;
  receiveNotification: boolean;
  friendInvitation: boolean;
  actualiteKompot: boolean;
  rangeDistance: number;
}

export enum UserStatus {
  ACTIVE,
  DELETED,
}
