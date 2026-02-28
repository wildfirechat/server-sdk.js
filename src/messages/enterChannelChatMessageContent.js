import MessageContent from "./messageContent.js";
import MessageContentType from "./messageContentType.js";

export default class EnterChannelChatMessageContent extends MessageContent {
    constructor() {
        super(MessageContentType.Enter_Channel_Chat);
    }

}
