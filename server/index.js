import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM模块路径处理
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const SESSIONS_DIR = path.join(__dirname, 'sessions');

// 中间件
app.use(cors());
app.use(express.json());

// 初始化会话目录
async function initServer() {
    try {
        await fs.mkdir(SESSIONS_DIR, { recursive: true });
        console.log(`会话存储目录已创建: ${SESSIONS_DIR}`);
    } catch (error) {
        console.error('目录初始化失败:', error);
    }
}

// 添加在 Express 初始化部分
app.use(express.json()); // 必须的中间件，用于解析JSON body

app.post('/newsessions', async (req, res) => {
    const generateSuffix = (length = 4) => {
        const BASE62 = "abcdefghijklmnopqrstuvwxyz";
        return Array.from({ length }, () =>
            BASE62[Math.floor(Math.random() * BASE62.length)]
        ).join('');
    };
    const checkFileExists = async (filename) => {
        try {
            await fs.access(path.join(SESSIONS_DIR, filename));
            return true;
        } catch {
            return false;
        }
    };

    try {
        const session = req.body; // 直接获取已解析的JSON
        if (!session.createdAt || typeof session.createdAt !== 'number') {
            return res.status(400).json({ error: '缺少有效的时间戳' });
        }

        // 自动生成唯一ID
        session.id = generateSuffix(8);
        let contentPrefix
        const firstMessage = session.messages[1];
        if (firstMessage && firstMessage.content && firstMessage.content.length > 0) {
            contentPrefix = firstMessage.content.slice(0, 7)    // 保留中文、字母、数字、下划线，其他字符替换为下划线
                .replace(/[^\u4e00-\u9fa5a-zA-Z0-9_]/g, '_')    // 移除开头和结尾的连续下划线（如果清理后全是非法字符）
                .replace(/^_+|_+$/g, '')    // 处理空值情况（如果清理后内容为空）
                .padEnd(1, '新建会话'); // 至少保留1个字符
        } else {
            contentPrefix = '新建会话';
        }
        // 生成基础文件名
        let sessionname = `${contentPrefix}.olm`;
        let retries = 0;

        // 检查文件名冲突并尝试解决
        while (await checkFileExists(sessionname)) {
            const suffix = generateSuffix(2); // 生成2位随机后缀
            sessionname = `${contentPrefix}_${suffix}.olm`;
            retries++;
            if (retries > 10) {
                throw new Error('无法生成唯一文件名');
            }
        }
        session.filePath = path.join(SESSIONS_DIR, `${session.sessionName}.olm`);
        session.sessionName = sessionname.replace(/\.olm$/, '');
        

        // 写入文件（包含版本信息）
        await fs.writeFile(
            session.filePath,
            JSON.stringify({
                ...session,
            }, null, 2)
        );

        res.status(201).json({
            session,
            message: `会话创建成功，路径: ${session.filePath}`
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] 创建错误:`, error);
        res.status(500).json({
            error: '会话创建失败',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.get('/getsessions', async (req, res) => {
    try {
        const files = await fs.readdir(SESSIONS_DIR);
        const sessions = await Promise.all(
            files.filter(file => file.endsWith('.olm')) // 只处理.olm文件
                .map(async (file) => {
                    try {
                        const filePath = path.join(SESSIONS_DIR, file);
                        const content = await fs.readFile(filePath, 'utf8');
                        const sessionData = JSON.parse(content);

                        return {
                            ...sessionData,
                            id: sessionData.id || path.basename(file, '.olm'),
                            filePath: filePath
                        };
                    } catch (fileError) {
                        // 记录错误但继续处理其他文件
                        console.error(`文件解析失败: ${file}`, fileError);
                        return null;
                    }
                })
        );

        // 过滤掉解析失败的文件
        const validSessions = sessions.filter(session => session !== null);

        // 按最后更新时间排序（降序）
        validSessions.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

        res.json(validSessions);
    } catch (error) {
        console.error('获取会话列表失败:', error);
        res.status(500).json({
            error: '无法读取会话数据',
            detail: error.message
        });
    }
});
app.post('/catsessions', async (req, res) => {
    try {
        const { filePath } = req.body;

        // 校验必要参数
        if (!filePath) {
            return res.status(400).json({ error: '缺少filePath参数' });
        }

        // 读取文件内容
        const content = await fs.readFile(filePath, 'utf8');

        // 将文件内容解析为JSON对象
        const sessionData = JSON.parse(content);

        // 如果文件存储的是字符串化的JSON，需要二次解析（根据实际情况调整）
        const parsedData = typeof sessionData === 'string'
            ? JSON.parse(sessionData)
            : sessionData;

        res.json(parsedData);
    } catch (error) {
        // 统一处理文件不存在、路径错误、解析失败等情况
        res.status(404).json({ error: '会话不存在' });
    }
});

app.put('/savesessions', async (req, res) => {
    try {
        const session = req.body;
        let needRename = false;

        // 工具函数：生成随机后缀
        const generateSuffix = (length = 2) => {
            const BASE62 = "abcdefghijklmnopqrstuvwxyz";
            return Array.from({ length }, () =>
                BASE62[Math.floor(Math.random() * BASE62.length)]
            ).join('');
        };

        // 工具函数：生成安全文件名前缀
        const generateContentPrefix = (content) => {
            return content.slice(0, 7)
                .replace(/[^\u4e00-\u9fa5a-zA-Z0-9_]/g, '_')
                .replace(/^_+|_+$/g, '')
                .padEnd(1, '新建会话');
        };

        // 检测是否需要重命名
        const currentFileName = path.basename(session.filePath);
        console.log('currentFileName:', currentFileName);
        if (currentFileName.startsWith('新建会话')) {
            console.log('需要重命名');
            try {
                // 获取消息内容生成前缀
                const firstMessageContent = session.messages[1]?.content || '';
                let contentPrefix = generateContentPrefix(firstMessageContent);

                // 生成基础新文件名
                let newFileName = `${contentPrefix}.olm`;
                let newFilePath;
                let retries = 0;

                // 处理文件名冲突
                do {
                    newFilePath = path.join(SESSIONS_DIR, newFileName);
                    try {
                        await fs.access(newFilePath);
                        // 文件存在时添加后缀
                        newFileName = `${contentPrefix}_${generateSuffix(2)}.olm`;
                        retries++;
                    } catch {
                        // 文件不存在时跳出循环
                        break;
                    }
                } while (retries < 5); // 最多尝试5次

                // 执行重命名操作
                await fs.rename(session.filePath, newFilePath);

                // 更新会话信息
                session.filePath = newFilePath;
                session.sessionName = newFileName.replace(/\.olm$/, '');
                needRename = true;
            } catch (renameError) {
                // console.error('文件重命名失败:', renameError);
                // throw new Error('自动重命名失败，请手动保存');
            }
        }

        // 写入文件（无论是否重命名都需要保存最新内容）
        await fs.writeFile(
            session.filePath,
            JSON.stringify(session, null, 2)
        );

        res.status(200).json({
            success: true,
            renamed: needRename,
            newPath: session.filePath
        });
    } catch (error) {
        console.error('保存会话失败:', error);
        res.status(500).json({
            error: error.message.startsWith('自动重命名')
                ? error.message
                : '保存失败',
            details: process.env.NODE_ENV === 'development'
                ? error.stack
                : undefined
        });
    }
});

// 启动服务器
app.listen(PORT, async () => {
    await initServer();
    console.log(`服务器运行在 http://localhost:${PORT}`);
});