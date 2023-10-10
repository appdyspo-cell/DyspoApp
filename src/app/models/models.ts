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
  dyspoStatus: UserDyspoStatus;
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
  biometricAuth: boolean;
}

export interface Chatroom {
  chatroomKey: string;
  description: string;
  count: number;
  lastMessage: string;
  startMessageId: number;
  nextMessageId: number;
  blocked?: boolean;
  blockedBy?: string;
  blockedTime?: string;
  blockedTimeMs?: number;
  isArchived?: boolean;
}

export interface AgendaEvent {
  title?: string;
  startISO: string;
  endISO: string;
  uid?: string;
  status: AgendaEventStatus;
  type: AgendaEventType;
  start_date_formatted?: string;
  start_time_formatted?: string;
  end_date_formatted?: string;
  end_time_formatted?: string;
}

export interface AgendaDyspo {
  uid?: string;
  time: number;
  userDyspo: UserDyspoStatus;
  month: number;
  year: number;
}

export interface AgendaEventForm {
  title: string;
  startISO: string;
  endISO: string;
  agendaEvent_uid?: string;
  status: AgendaEventStatus;
  isKids: boolean;
}

export interface DBUser {
  firstname: string;
  lastname: string;
  avatar: string;
  chatIds?: string[];
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export enum UserDyspoStatus {
  DYSPO = 'DYSPO',
  DYSPOWITHKIDS = 'DYSPOWITHKIDS',
  NODYSPO = 'NODYSPO',
}

export enum AgendaEventStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export enum AgendaEventType {
  KIDS = 'KIDS',
  NOKIDS = 'NOKIDS',
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
