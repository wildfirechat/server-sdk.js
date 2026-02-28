import APIPath from './utils/apiPath.js';
import httpUtils from './utils/httpUtils.js';

/**
 * 通用管理类
 * 
 * 提供通用的系统管理功能，包括：
 * - 系统设置管理
 * - 文件管理（会话文件、用户文件）
 * - 用户设置管理（会话置顶等）
 * - 健康检查
 */
class GeneralAdmin {
    /**
     * 获取系统设置
     * @param {number} id - 设置项ID
     * @returns {Promise<IMResult>}
     */
    static async getSystemSetting(id) {
        const input = {
            id: id
        };
        return httpUtils.httpJsonPost(APIPath.Get_System_Setting, input);
    }

    /**
     * 设置系统设置
     * @param {number} id - 设置项ID
     * @param {string} value - 设置值
     * @param {string} [desc] - 设置描述
     * @returns {Promise<IMResult>}
     */
    static async setSystemSetting(id, value, desc = null) {
        const input = {
            id: id,
            value: value,
            desc: desc
        };
        return httpUtils.httpJsonPost(APIPath.Put_System_Setting, input);
    }

    /**
     * 获取会话文件列表（仅专业版支持）
     * @param {number} conversationType - 会话类型
     * @param {string} target - 会话目标ID
     * @param {number} line - 线路
     * @param {string} userId - 用户ID
     * @param {number} offset - 偏移量
     * @param {boolean} desc - 是否降序
     * @param {number} count - 每页数量
     * @returns {Promise<IMResult>}
     */
    static async getConversationFiles(conversationType, target, line, userId, offset, desc, count) {
        const input = {
            conversationType: conversationType,
            target: target,
            line: line,
            userId: userId,
            offset: offset,
            desc: desc,
            count: count
        };
        return httpUtils.httpJsonPost(APIPath.Get_Conversation_Files, input);
    }

    /**
     * 获取用户文件列表
     * @param {string} userId - 用户ID
     * @param {number} offset - 偏移量
     * @param {boolean} desc - 是否降序
     * @param {number} count - 每页数量
     * @returns {Promise<IMResult>}
     */
    static async getUserFiles(userId, offset, desc, count) {
        const input = {
            userId: userId,
            offset: offset,
            desc: desc,
            count: count
        };
        return httpUtils.httpJsonPost(APIPath.Get_User_Files, input);
    }

    /**
     * 根据消息ID获取文件信息
     * @param {number} messageId - 消息ID
     * @returns {Promise<IMResult>}
     */
    static async getFile(messageId) {
        const input = {
            value: messageId
        };
        return httpUtils.httpJsonPost(APIPath.Get_Message_File, input);
    }

    /**
     * 设置会话置顶
     * @param {string} userId - 用户ID
     * @param {number} conversationType - 会话类型
     * @param {string} target - 会话目标ID
     * @param {number} line - 线路
     * @param {boolean} isTop - true-置顶，false-取消置顶
     * @returns {Promise<IMResult>}
     */
    static async setConversationTop(userId, conversationType, target, line, isTop) {
        const key = `${conversationType}-${line}-${target}`;
        const value = isTop ? '1' : '0';
        return this.setUserSetting(userId, 3, key, value);
    }

    /**
     * 获取会话置顶状态
     * @param {string} userId - 用户ID
     * @param {number} conversationType - 会话类型
     * @param {string} target - 会话目标ID
     * @param {number} line - 线路
     * @returns {Promise<IMResult>}
     */
    static async getConversationTop(userId, conversationType, target, line) {
        const key = `${conversationType}-${line}-${target}`;
        const result = await this.getUserSetting(userId, 3, key);
        
        // 转换为布尔值结果
        if (result.isSuccess()) {
            const isTop = result.result && result.result.value === '1';
            result.result = isTop;
        }
        return result;
    }

    /**
     * 获取用户设置
     * @param {string} userId - 用户ID
     * @param {number} scope - 设置范围
     * @param {string} key - 设置键
     * @returns {Promise<IMResult>}
     */
    static async getUserSetting(userId, scope, key) {
        const pojo = {
            userId: userId,
            scope: scope,
            key: key
        };
        return httpUtils.httpJsonPost(APIPath.User_Get_Setting, pojo);
    }

    /**
     * 设置用户设置
     * @param {string} userId - 用户ID
     * @param {number} scope - 设置范围
     * @param {string} key - 设置键
     * @param {string} value - 设置值
     * @returns {Promise<IMResult>}
     */
    static async setUserSetting(userId, scope, key, value) {
        const pojo = {
            userId: userId,
            scope: scope,
            key: key,
            value: value
        };
        return httpUtils.httpJsonPost(APIPath.User_Put_Setting, pojo);
    }

    /**
     * 健康检查
     * @returns {Promise<IMResult>}
     */
    static async healthCheck() {
        return httpUtils.httpGet(APIPath.Health);
    }

    /**
     * 获取客户信息
     * @returns {Promise<IMResult>}
     */
    static async getCustomer() {
        return httpUtils.httpJsonPost(APIPath.GET_CUSTOMER, null);
    }
}

export default GeneralAdmin;
