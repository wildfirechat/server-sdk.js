import MessageContent from "./messageContent.js";
import MessageContentType from "./messageContentType.js";

export default class LeaveChannelChatMessageContent extends MessageContent {
    constructor() {
        super(MessageContentType.Leave_Channel_Chat);
    }

}
