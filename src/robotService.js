import crypto from 'crypto';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import APIPath from './utils/apiPath.js';
import httpUtils from './utils/httpUtils.js';
import IMResult from './utils/imResult.js';

/**
 * 机器人服务类
 * 
 * 提供机器人相关的功能，包括：
 * - 发送和回复消息
 * - 获取用户信息
 * - 群组管理
 * - 朋友圈管理
 * - 会议控制
 * - 回调管理
 */
class RobotService {
    /**
     * 创建机器人服务实例
     * @param {string} url - IM服务器地址
     * @param {string} robotId - 机器人ID
     * @param {string} robotSecret - 机器人密钥
     * @param {number} [timeout=15000] - 超时时间（毫秒）
     */
    constructor(url, robotId, robotSecret, timeout = 15000) {
        this.baseUrl = url;
        this.robotId = robotId;
        this.robotSecret = robotSecret;
        this.timeout = timeout;
    }

    /**
     * 获取机器人ID
     * @returns {string}
     */
    getRobotId() {
        return this.robotId;
    }

    /**
     * 获取机器人密钥
     * @returns {string}
     */
    getRobotSecret() {
        return this.robotSecret;
    }

    /**
     * 发送HTTP POST请求
     * @private
     * @param {string} path - 请求路径
     * @param {object} data - 请求数据
     * @returns {Promise<IMResult>}
     */
    async _httpPost(path, data) {
        // 使用专门的机器人HTTP工具，需要在httpUtils中扩展支持
        // 这里复用admin的http工具，但实际机器人API使用不同的认证方式

        const url = new URL(path, this.baseUrl);
        
        // 生成机器人签名
        const nonce = Math.floor(Math.random() * 100000) + 3;
        const timestamp = Math.floor(Date.now() / 1000);
        const str = `${nonce}|${this.robotId}|${timestamp}|${this.robotSecret}`;
        const sign = crypto.createHash('sha1').update(str).digest('hex');

        const postData = data ? JSON.stringify(data) : '';

        const options = {
            method: 'POST',
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Connection': 'Keep-Alive',
                'nonce': nonce.toString(),
                'timestamp': timestamp.toString(),
                'sign': sign,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        return new Promise((resolve, reject) => {
            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.request(url, options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(responseData);
                        resolve(new IMResult(result.code, result.msg, result.result));
                    } catch (error) {
                        reject(new Error(`JSON解析失败: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`HTTP请求异常: ${error.message}`));
            });

            if (postData) {
                req.write(postData);
            }
            req.end();
        });
    }

    // ========== 消息相关 ==========

    /**
     * 发送消息
     * @param {string} sender - 发送者用户ID
     * @param {object} conversation - 会话信息
     * @param {object} payload - 消息内容
     * @returns {Promise<IMResult>}
     */
    async sendMessage(sender, conversation, payload) {
        return this.sendMessageWithOptions(sender, conversation, payload, null);
    }

    /**
     * 发送消息（可指定接收用户）
     * @param {string} sender - 发送者用户ID
     * @param {object} conversation - 会话信息
     * @param {object} payload - 消息内容
     * @param {string[]} [toUsers] - 接收用户ID列表
     * @returns {Promise<IMResult>}
     */
    async sendMessageWithOptions(sender, conversation, payload, toUsers) {
        const messageData = {
            sender: sender,
            conv: conversation,
            toUsers: toUsers,
            payload: payload
        };
        return this._httpPost(APIPath.Robot_Message_Send, messageData);
    }

    /**
     * 回复消息
     * @param {number} messageUid - 消息UID
     * @param {object} payload - 消息内容
     * @param {boolean} [only2Sender=false] - 是否只回复给发送者
     * @returns {Promise<IMResult>}
     */
    async replyMessage(messageUid, payload, only2Sender = false) {
        const messageData = {
            messageUid: messageUid,
            only2Sender: only2Sender,
            payload: payload
        };
        return this._httpPost(APIPath.Robot_Message_Reply, messageData);
    }

    /**
     * 撤回消息
     * @param {number} messageUid - 消息UID
     * @returns {Promise<IMResult>}
     */
    async recallMessage(messageUid) {
        const messageData = {
            messageUid: messageUid
        };
        return this._httpPost(APIPath.Robot_Message_Recall, messageData);
    }

    /**
     * 更新消息
     * @param {number} messageUid - 消息UID
     * @param {object} payload - 消息内容
     * @returns {Promise<IMResult>}
     */
    async updateMessage(messageUid, payload) {
        const updateMessageContentData = {
            messageUid: messageUid,
            payload: payload,
            updateTimestamp: 0,
            distribute: 1
        };
        return this._httpPost(APIPath.Robot_Message_Update, updateMessageContentData);
    }

    // ========== 用户相关 ==========

    /**
     * 获取用户信息
     * @param {string} userId - 用户ID
     * @returns {Promise<IMResult>}
     */
    async getUserInfo(userId) {
        const getUserInfo = {
            userId: userId
        };
        return this._httpPost(APIPath.Robot_User_Info, getUserInfo);
    }

    /**
     * 通过手机号获取用户信息
     * @param {string} phone - 手机号
     * @returns {Promise<IMResult>}
     */
    async getUserInfoByMobile(phone) {
        const getUserInfo = {
            mobile: phone
        };
        return this._httpPost(APIPath.Robot_User_Info, getUserInfo);
    }

    /**
     * 通过用户名获取用户信息
     * @param {string} userName - 用户名
     * @returns {Promise<IMResult>}
     */
    async getUserInfoByName(userName) {
        const getUserInfo = {
            name: userName
        };
        return this._httpPost(APIPath.Robot_User_Info, getUserInfo);
    }

    /**
     * 设置回调地址
     * @param {string} url - 回调地址
     * @returns {Promise<IMResult>}
     */
    async setCallback(url) {
        const pojo = {
            url: url
        };
        return this._httpPost(APIPath.Robot_Set_Callback, pojo);
    }

    /**
     * 获取回调地址
     * @returns {Promise<IMResult>}
     */
    async getCallback() {
        return this._httpPost(APIPath.Robot_Get_Callback, null);
    }

    /**
     * 删除回调地址
     * @returns {Promise<IMResult>}
     */
    async deleteCallback() {
        return this._httpPost(APIPath.Robot_Delete_Callback, null);
    }

    /**
     * 获取机器人资料
     * @returns {Promise<IMResult>}
     */
    async getProfile() {
        return this._httpPost(APIPath.Robot_Get_Profile, null);
    }

    /**
     * 更新机器人资料
     * @param {number} type - 资料类型（MyInfoType）
     * @param {string} value - 资料值
     * @returns {Promise<IMResult>}
     */
    async updateProfile(type, value) {
        const pojo = {
            first: type,
            second: value
        };
        return this._httpPost(APIPath.Robot_Update_Profile, pojo);
    }

    /**
     * 通过应用授权码获取用户信息
     * @param {string} authCode - 应用授权码
     * @returns {Promise<IMResult>}
     */
    async applicationGetUserInfo(authCode) {
        const input = {
            authCode: authCode
        };
        return this._httpPost(APIPath.Robot_Application_Get_UserInfo, input);
    }

    /**
     * 获取应用签名
     * @returns {object}
     */
    getApplicationSignature() {
        const nonce = Math.floor(Math.random() * 100000) + 3;
        const timestamp = Math.floor(Date.now() / 1000);
        const str = `${nonce}|${this.robotId}|${timestamp}|${this.robotSecret}`;
        const sign = crypto.createHash('sha1').update(str).digest('hex');

        return {
            appId: this.robotId,
            appType: 2, // ApplicationType_Robot
            timestamp: timestamp,
            nonceStr: nonce.toString(),
            signature: sign
        };
    }

    // ========== 群组相关 ==========

    /**
     * 创建群组
     * @param {object} groupInfo - 群组信息
     * @param {object[]} [members] - 成员列表
     * @param {string} [memberExtra] - 成员额外信息
     * @param {number[]} [toLines] - 线路列表
     * @param {object} [notifyMessage] - 通知消息
     * @returns {Promise<IMResult>}
     */
    async createGroup(groupInfo, members = [], memberExtra = null, toLines = null, notifyMessage = null) {
        const pojoGroup = {
            group_info: groupInfo,
            members: members
        };
        const createGroup = {
            group: pojoGroup,
            member_extra: memberExtra,
            to_lines: toLines,
            notify_message: notifyMessage
        };
        return this._httpPost(APIPath.Robot_Create_Group, createGroup);
    }

    /**
     * 获取群组信息
     * @param {string} groupId - 群组ID
     * @returns {Promise<IMResult>}
     */
    async getGroupInfo(groupId) {
        const input = {
            groupId: groupId
        };
        return this._httpPost(APIPath.Robot_Group_Get_Info, input);
    }

    /**
     * 解散群组
     * @param {string} groupId - 群组ID
     * @param {number[]} [toLines] - 线路列表
     * @param {object} [notifyMessage] - 通知消息
     * @returns {Promise<IMResult>}
     */
    async dismissGroup(groupId, toLines = null, notifyMessage = null) {
        const dismissGroup = {
            group_id: groupId,
            to_lines: toLines,
            notify_message: notifyMessage
        };
        return this._httpPost(APIPath.Robot_Group_Dismiss, dismissGroup);
    }

    /**
     * 转让群组
     * @param {string} groupId - 群组ID
     * @param {string} newOwner - 新群主ID
     * @param {number[]} [toLines] - 线路列表
     * @param {object} [notifyMessage] - 通知消息
     * @returns {Promise<IMResult>}
     */
    async transferGroup(groupId, newOwner, toLines = null, notifyMessage = null) {
        const transferGroup = {
            group_id: groupId,
            new_owner: newOwner,
            to_lines: toLines,
            notify_message: notifyMessage
        };
        return this._httpPost(APIPath.Robot_Group_Transfer, transferGroup);
    }

    /**
     * 修改群组信息
     * @param {string} groupId - 群组ID
     * @param {number} type - 修改类型
     * @param {string} value - 新值
     * @param {number[]} [toLines] - 线路列表
     * @param {object} [notifyMessage] - 通知消息
     * @returns {Promise<IMResult>}
     */
    async modifyGroupInfo(groupId, type, value, toLines = null, notifyMessage = null) {
        const modifyGroupInfo = {
            group_id: groupId,
            to_lines: toLines,
            type: type,
            value: value,
            notify_message: notifyMessage
        };
        return this._httpPost(APIPath.Robot_Group_Modify_Info, modifyGroupInfo);
    }

    /**
     * 获取群组成员列表
     * @param {string} groupId - 群组ID
     * @returns {Promise<IMResult>}
     */
    async getGroupMembers(groupId) {
        const input = {
            groupId: groupId
        };
        return this._httpPost(APIPath.Robot_Group_Member_List, input);
    }

    /**
     * 获取群组成员信息
     * @param {string} groupId - 群组ID
     * @param {string} memberId - 成员ID
     * @returns {Promise<IMResult>}
     */
    async getGroupMember(groupId, memberId) {
        const input = {
            groupId: groupId,
            memberId: memberId
        };
        return this._httpPost(APIPath.Robot_Group_Member_Get, input);
    }

    /**
     * 添加群组成员
     * @param {string} groupId - 群组ID
     * @param {object[]} groupMembers - 成员列表
     * @param {string} [memberExtra] - 成员额外信息
     * @param {number[]} [toLines] - 线路列表
     * @param {object} [notifyMessage] - 通知消息
     * @returns {Promise<IMResult>}
     */
    async addGroupMembers(groupId, groupMembers, memberExtra = null, toLines = null, notifyMessage = null) {
        const addGroupMember = {
            group_id: groupId,
            members: groupMembers,
            memberExtra: memberExtra,
            to_lines: toLines,
            notify_message: notifyMessage
        };
        return this._httpPost(APIPath.Robot_Group_Member_Add, addGroupMember);
    }

    /**
     * 设置群组管理员
     * @param {string} groupId - 群组ID
     * @param {string[]} groupMemberIds - 成员ID列表
     * @param {boolean} isManager - 是否为管理员
     * @param {number[]} [toLines] - 线路列表
     * @param {object} [notifyMessage] - 通知消息
     * @returns {Promise<IMResult>}
     */
    async setGroupManager(groupId, groupMemberIds, isManager, toLines = null, notifyMessage = null) {
        const addGroupMember = {
            group_id: groupId,
            members: groupMemberIds,
            is_manager: isManager,
            to_lines: toLines,
            notify_message: notifyMessage
        };
        return this._httpPost(APIPath.Robot_Group_Set_Manager, addGroupMember);
    }

    /**
     * 禁言群组成员
     * @param {string} groupId - 群组ID
     * @param {string[]} groupMemberIds - 成员ID列表
     * @param {boolean} isMute - 是否禁言
     * @param {number[]} [toLines] - 线路列表
     * @param {object} [notifyMessage] - 通知消息
     * @returns {Promise<IMResult>}
     */
    async muteGroupMember(groupId, groupMemberIds, isMute, toLines = null, notifyMessage = null) {
        const addGroupMember = {
            group_id: groupId,
            members: groupMemberIds,
            is_manager: isMute,
            to_lines: toLines,
            notify_message: notifyMessage
        };
        return this._httpPost(APIPath.Robot_Group_Mute_Member, addGroupMember);
    }

    /**
     * 允许群组成员发言
     * @param {string} groupId - 群组ID
     * @param {string[]} groupMemberIds - 成员ID列表
     * @param {boolean} isAllow - 是否允许
     * @param {number[]} [toLines] - 线路列表
     * @param {object} [notifyMessage] - 通知消息
     * @returns {Promise<IMResult>}
     */
    async allowGroupMember(groupId, groupMemberIds, isAllow, toLines = null, notifyMessage = null) {
        const addGroupMember = {
            group_id: groupId,
            members: groupMemberIds,
            is_manager: isAllow,
            to_lines: toLines,
            notify_message: notifyMessage
        };
        return this._httpPost(APIPath.Robot_Group_Allow_Member, addGroupMember);
    }

    /**
     * 踢出群组成员
     * @param {string} groupId - 群组ID
     * @param {string[]} groupMemberIds - 成员ID列表
     * @param {number[]} [toLines] - 线路列表
     * @param {object} [notifyMessage] - 通知消息
     * @returns {Promise<IMResult>}
     */
    async kickoffGroupMembers(groupId, groupMemberIds, toLines = null, notifyMessage = null) {
        const kickoffGroupMember = {
            group_id: groupId,
            members: groupMemberIds,
            to_lines: toLines,
            notify_message: notifyMessage
        };
        return this._httpPost(APIPath.Robot_Group_Member_Kickoff, kickoffGroupMember);
    }

    /**
     * 退出群组
     * @param {string} groupId - 群组ID
     * @param {number[]} [toLines] - 线路列表
     * @param {object} [notifyMessage] - 通知消息
     * @returns {Promise<IMResult>}
     */
    async quitGroup(groupId, toLines = null, notifyMessage = null) {
        const quitGroup = {
            group_id: groupId,
            to_lines: toLines,
            notify_message: notifyMessage
        };
        return this._httpPost(APIPath.Robot_Group_Member_Quit, quitGroup);
    }

    /**
     * 设置群组成员别名
     * @param {string} groupId - 群组ID
     * @param {string} memberId - 成员ID
     * @param {string} alias - 别名
     * @param {number[]} [toLines] - 线路列表
     * @param {object} [notifyMessage] - 通知消息
     * @returns {Promise<IMResult>}
     */
    async setGroupMemberAlias(groupId, memberId, alias, toLines = null, notifyMessage = null) {
        const input = {
            group_id: groupId,
            memberId: memberId,
            alias: alias,
            to_lines: toLines,
            notify_message: notifyMessage
        };
        return this._httpPost(APIPath.Robot_Group_Set_Member_Alias, input);
    }

    /**
     * 设置群组成员额外信息
     * @param {string} groupId - 群组ID
     * @param {string} memberId - 成员ID
     * @param {string} extra - 额外信息
     * @param {number[]} [toLines] - 线路列表
     * @param {object} [notifyMessage] - 通知消息
     * @returns {Promise<IMResult>}
     */
    async setGroupMemberExtra(groupId, memberId, extra, toLines = null, notifyMessage = null) {
        const input = {
            group_id: groupId,
            memberId: memberId,
            extra: extra,
            to_lines: toLines,
            notify_message: notifyMessage
        };
        return this._httpPost(APIPath.Robot_Group_Set_Member_Extra, input);
    }

    // ========== 会议相关 ==========

    /**
     * 发送会议请求
     * @param {string} robotId - 机器人ID
     * @param {string} clientId - 客户端ID
     * @param {string} request - 请求类型
     * @param {number} sessionId - 会话ID
     * @param {string} roomId - 房间ID
     * @param {string} data - 请求数据
     * @param {boolean} [advance=false] - 是否高级模式
     * @returns {Promise<IMResult>}
     */
    async sendConferenceRequest(robotId, clientId, request, sessionId, roomId, data, advance = false) {
        const input = {
            robotId: robotId,
            clientId: clientId,
            request: request,
            sessionId: sessionId,
            roomId: roomId,
            data: data,
            advance: advance
        };
        return this._httpPost(APIPath.Robot_Conference_Request, input);
    }
}

export default RobotService;
