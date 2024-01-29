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
  friendListUid?: string;
  tagline?: string;
  avg_rates?: number;
  nb_rates?: number;
  created_at_ms?: number;
  is_phoneVerified?: boolean;
  is_my_friend?: boolean;
  geo_zone?: string;
  with_kids?: boolean;
}

export interface AppDeviceContact {
  uid: string | undefined;
  display: string;
  phone_number: string;
  is_member: boolean | undefined;
  is_my_friend: boolean | undefined;
  initials: string | undefined;
  avatar: string | undefined;
}

export interface Friend extends AppUser {
  sinceDate?: number;
  requestDate?: number;
  friend_status?: FriendStatus;
  friend_uid?: string;

  userData?: AppUser;
}

export interface AppUserWithEvents extends AppUser {
  agendaEvents?: AgendaEvent[];
}

export interface FriendGroup {
  uid: string;
  label: string;
  avatarPath?: string;
  sinceDate?: number;
  status: FriendGroupStatus;
  admin_uid: string;
  members_uid: string[];
  checked_friends?: CheckedFriends[];
}

export interface CheckedFriends {
  friend: Friend;
  isChecked: boolean;
  isCheckedPending: boolean;
  disable: boolean;
  dyspo?: UserDyspoStatus;
  agendaEvents: AgendaEvent[];
}

export interface AppSettings {
  receiveEmail: boolean;
  receiveNotification: boolean;
  friendInvitation: boolean;
  eventInvitation: boolean;
  actualiteDyspo: boolean;
  shareAgenda: boolean;
}

export interface Chatroom {
  uid?: string;
  description?: string;
  count: number;
  lastMessageRead?: string;
  //lastMessage: string;
  startMessageId: number;
  nextMessageId: number;
  blocked?: boolean;
  blockedBy?: string;
  blockedTime?: string;
  blockedTimeMs?: number;
  quit_chatroom_at?: number;
  isArchived?: boolean;
  isNotifications: boolean;
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
  place_id?: string;
  place_description?: string;
  avatar?: string;
  members_uid: string[];
  members_invited_uid: string[];
  admin_uid: string;
  all_can_edit: boolean;
  all_can_see_title: boolean;
  // day: number;
  // month: number;
  // year: number;
  start_date_ts: number;
  end_date_ts: number;
  start_date_day_of_year: number;
  end_date_day_of_year: number;
  start_date_year: number;
  end_date_year: number;
  last_message?: ChatMessage;
  is_multi: boolean;
  recurrence: AgendaEventRecurrence;
  recurrence_nb: string;
  recurrence_end_ISO?: string;
  parent_agenda_event_uid?: string;
  [member_uid: string]:
    | string
    | number
    | undefined
    | string[]
    | boolean
    | ChatMessage
    | Chatroom;
}

export interface UserAgendaEventsByDay {
  uid: string;
  agendaEvents: AgendaEvent[];
  // day: number;
  // month: number;
  // year: number;
}

export interface FriendDyspo {
  friend_uid: string;
  friend_dyspo: UserDyspoStatus;
  dyspo_date_ISO: string;
}

export interface CrudFBAction {
  MODIFIED: 'MODIFIED';
  ADDDED: 'ADDED';
  REMOVED: 'REMOVED';
}

export interface AgendaDyspoItem {
  uid?: string;
  time: number;
  userDyspo: UserDyspoStatus;
  day: number;
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

export interface Notif {
  id?: string;
  user_id: string;
  title: string;
  message: string;
  subject: string;
  data?: any;
  avatarPath?: string;
  create_at_ms: number;
  create_at_ISO: string;
  status: string;
}

export interface ChatMessage {
  uid: string;
  sender: string;
  time: string;
  time_ms: number;
  message?: string;
  image?: string;
  video?: string;
  map?: string;
  read_by: string[];
  date_ISO: string;
  deleted_by: string[];
  is_deleted?: boolean;
}

export interface WarnReportUser {
  id?: string;
  report_date_ms: number;
  report_date_ISO?: string;
  from_user_id: string;
  from_user_data?: AppUser;
  report_user_data?: AppUser;
  report_user_id: string;
  report_text: string;
  result_user_status?: string;
}

export interface WarnReportMsg {
  uid: string;
  msg_uid: string;
  msg_sender_uid: string;
  msg_sender_data?: AppUser;
  agenda_event_uid: string;
  date_ms: number;
  date_ISO?: string;
  from_user_id: string;
  from_user_data?: AppUser;
  report_text?: string;
  status: WarnReportMsgStatus;
  result_user_status?: string;
  result_msg_status?: string;
}

export interface WarnReportGroup {
  uid: string;
  agenda_event_uid: string;
  last_five_messages: string[];
  members_uid: string[];
  date_ms: number;
  date_ISO?: string;
  from_user_id: string;
  from_user_data?: AppUser;
  report_text: string;
  status: WarnReportGroupStatus;
  result_user_status?: string;
  result_group_status?: string;
}

export interface HolidaysEvent {
  uid: string;
  start_date_formatted?: string;
  start_date_ISO: string;
  start_date_ts: number;
  end_date_ISO: string;
  end_date_formatted?: string;
  end_date_ts: number;
  geo_zone: string;
}

export enum DiscussionType {
  ARCHIVE = 'ARCHIVE',
  ACTIVE = 'ACTIVE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export enum UserDyspoStatus {
  DYSPO = 'DYSPO',
  DYSPOWITHKIDS = 'DYSPOWITHKIDS',
  NODYSPO = 'NODYSPO',
  UNDEFINED = 'UNDEFINED',
}

export enum AgendaEventStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export enum AgendaEventType {
  KIDS = 'KIDS',
  NOKIDS = 'NOKIDS',
  FREE = 'FREE',
}

export enum AgendaEventRecurrence {
  ONE = 'ONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export enum FriendStatus {
  FRIEND = 'FRIEND',
  PENDING = 'PENDING',
  INVITED = 'INVITED',
  SUGGESTED = 'SUGGESTED',
  NOFRIEND = 'NOFRIEND',
}

export enum FriendGroupStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export enum NotifSubject {
  MESSAGE = 'MESSAGE',
  INVITE = 'INVITE',
  AGENDA_EVENT = 'AGENDA_EVENT',
}

export enum WarnReportMsgStatus {
  CREATED = 'CREATED',
  ARCHIVED = 'ARCHIVED',
  USER_BANNED = 'USER_BANNED',
  MSG_REMOVED = 'MSG_REMOVED',
}

export enum WarnReportGroupStatus {
  CREATED = 'CREATED',
  ARCHIVED = 'ARCHIVED',
  USERS_BANNED = 'USERS_BANNED',
  GROUP_REMOVED = 'GROUP_REMOVED',
}

export enum ShowHelper {
  DASHBOARD = 'DASHBOARD',
  FRIENDS = 'FRIENDS',
  AGENDA = 'AGENDA',
}
