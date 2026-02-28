import MessageContent from "./messageContent.js";
import MessageContentType from "./messageContentType.js";

export default class StreamingTextGeneratedMessageContent extends MessageContent {
    text = '';
    streamId = '';

    constructor() {
        super(MessageContentType.Streaming_Text_Generated);
    }

    digest(message) {
        return this.text;
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.text;
        payload.content = this.streamId;
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.text = payload.searchableContent;
        this.streamId = payload.content;
    }
}
