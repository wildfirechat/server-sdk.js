/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import NotificationMessageContent from "./notificationMessageContent.js";
import MessageContentType from "../messageContentType.js";

export default class FriendAddedNotification extends NotificationMessageContent {

    constructor() {
        super(MessageContentType.Friend_Added);
    }

    formatNotification() {
        return "你们已经是好友了，可以开始聊天了。";
    }
}
