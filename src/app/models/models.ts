export interface AppUser {
  email?: string;
  uid: string;
  firstname?: string;
  lastname?: string;
  gender?: string;
  phoneNumber?: string;
  avatarPath?: string;
  appSettings?: AppSettings;
  status?: UserStatus;
  last_connexion_ms?: number;
  last_connexion_ISO?: string;
  firstConnexion?: boolean;
  notificationToken?: string;
  isConnected?: boolean;
  friendStatus?: string;
  friendListUid?: string;
  tagline?: string;
  avg_rates?: number;
  nb_rates?: number;
  created_at_ms?: number;
  is_phoneVerified?: boolean;
}

export interface Friend extends AppUser {
  sinceDate?: number;
  requestDate?: number;
  friend_status?: string;
  friend_uid?: string;

  userData?: AppUser;
}

export interface AppSettings {
  receiveEmail: boolean;
  receiveNotification: boolean;
  friendInvitation: boolean;
  actualiteDyspo: boolean;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export enum FriendStatus {
  FRIEND = 'FRIEND',
  PENDING = 'PENDING',
  INVITED = 'INVITED',
  SUGGESTED = 'SUGGESTED',
}

export enum NotifSubjects {
  MESSAGE = 'MESSAGE',
  INVITE = 'INVITE',
}
