// 博客管理系统
class BlogManager {
    constructor() {
        this.articles = this.loadArticles();
        this.currentEditingId = null;
        this.articlesPerPage = 6;
        this.currentPage = 1;
        this.init();
    }

    // 初始化
    init() {
        this.setupEventListeners();
        this.renderBlogList();
        this.setDefaultDate();
    }

    // 设置默认日期为今天
    setDefaultDate() {
        const dateInput = document.getElementById('articleDate');
        if (dateInput && !dateInput.value) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    }

    // 从localStorage加载文章
    loadArticles() {
        const stored = localStorage.getItem('blogArticles');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('加载文章失败:', e);
                return [];
            }
        }
        // 如果没有文章，添加一篇示例文章
        return [{
            id: Date.now(),
            title: '欢迎来到我的博客',
            category: '技术',
            date: new Date().toISOString().split('T')[0],
            excerpt: '这里将分享我的学习心得、技术思考和生活感悟。欢迎关注，期待与你的交流...',
            content: `# 欢迎来到我的博客

这是我的个人博客，我会在这里分享：

## 技术分享
- 编程学习心得
- 项目开发经验
- 技术问题解决方案

## 生活感悟
记录生活中的点点滴滴，分享成长路上的思考。

## 学习笔记
整理学习过程中的重要知识点和总结。

---

期待与你交流，共同成长！`,
            published: true
        }];
    }

    // 保存文章到localStorage
    saveArticles() {
        try {
            localStorage.setItem('blogArticles', JSON.stringify(this.articles));
        } catch (e) {
            console.error('保存文章失败:', e);
            alert('保存失败，可能是存储空间不足');
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 文章表单提交
        const articleForm = document.getElementById('articleForm');
        if (articleForm) {
            articleForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // 预览按钮
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.showPreview());
        }

        // 保存草稿按钮
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveDraft());
        }

        // 模态框关闭
        document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // 点击模态框外部关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });

        // 编辑文章按钮
        const editArticleBtn = document.getElementById('editArticleBtn');
        if (editArticleBtn) {
            editArticleBtn.addEventListener('click', () => this.editCurrentArticle());
        }

        // 删除文章按钮
        const deleteArticleBtn = document.getElementById('deleteArticleBtn');
        if (deleteArticleBtn) {
            deleteArticleBtn.addEventListener('click', () => this.deleteCurrentArticle());
        }

        // 加载更多按钮
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreArticles());
        }

        // 监听URL hash变化（用于编辑模式）
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.split('?')[0];
            if (hash === '#write') {
                const editId = new URLSearchParams(window.location.search).get('edit');
                if (editId) {
                    setTimeout(() => this.loadArticleForEdit(editId), 100);
                } else {
                    this.resetForm();
                }
            }
        });

        // 检查URL参数（页面加载时）
        setTimeout(() => {
            if (window.location.hash.includes('#write')) {
                const editId = new URLSearchParams(window.location.search).get('edit');
                if (editId) {
                    this.loadArticleForEdit(editId);
                }
            }
        }, 500);
    }

    // 处理表单提交
    handleSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('articleTitle').value.trim();
        const category = document.getElementById('articleCategory').value;
        const date = document.getElementById('articleDate').value;
        const excerpt = document.getElementById('articleExcerpt').value.trim();
        const content = document.getElementById('articleContent').value.trim();

        if (!title || !category || !date || !content) {
            alert('请填写所有必填字段！');
            return;
        }

        const article = {
            id: this.currentEditingId || Date.now(),
            title,
            category,
            date,
            excerpt: excerpt || this.generateExcerpt(content),
            content,
            published: true,
            updatedAt: new Date().toISOString()
        };

        if (this.currentEditingId) {
            // 更新现有文章
            const index = this.articles.findIndex(a => a.id === this.currentEditingId);
            if (index !== -1) {
                this.articles[index] = article;
            }
        } else {
            // 添加新文章
            this.articles.unshift(article);
        }

        this.saveArticles();
        this.renderBlogList();
        this.resetForm();
        
        // 滚动到博客部分
        document.getElementById('blog').scrollIntoView({ behavior: 'smooth' });
        
        alert(this.currentEditingId ? '文章更新成功！' : '文章发布成功！');
        this.currentEditingId = null;
    }

    // 生成文章摘要
    generateExcerpt(content) {
        // 移除Markdown标记
        const plainText = content
            .replace(/#{1,6}\s+/g, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/`/g, '')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .trim();
        
        // 取前150个字符
        return plainText.length > 150 
            ? plainText.substring(0, 150) + '...' 
            : plainText;
    }

    // 保存草稿
    saveDraft() {
        const title = document.getElementById('articleTitle').value.trim();
        const category = document.getElementById('articleCategory').value;
        const date = document.getElementById('articleDate').value;
        const excerpt = document.getElementById('articleExcerpt').value.trim();
        const content = document.getElementById('articleContent').value.trim();

        if (!title || !content) {
            alert('标题和内容不能为空！');
            return;
        }

        const article = {
            id: this.currentEditingId || Date.now(),
            title: title || '未命名草稿',
            category: category || '其他',
            date: date || new Date().toISOString().split('T')[0],
            excerpt: excerpt || this.generateExcerpt(content),
            content,
            published: false,
            updatedAt: new Date().toISOString()
        };

        if (this.currentEditingId) {
            const index = this.articles.findIndex(a => a.id === this.currentEditingId);
            if (index !== -1) {
                this.articles[index] = article;
            }
        } else {
            this.articles.unshift(article);
        }

        this.saveArticles();
        this.renderBlogList();
        alert('草稿保存成功！');
    }

    // 显示预览
    showPreview() {
        const title = document.getElementById('articleTitle').value.trim() || '预览标题';
        const category = document.getElementById('articleCategory').value || '未分类';
        const date = document.getElementById('articleDate').value || new Date().toISOString().split('T')[0];
        const content = document.getElementById('articleContent').value.trim() || '暂无内容';

        document.getElementById('previewTitle').textContent = title;
        document.getElementById('previewCategory').textContent = category;
        document.getElementById('previewDate').innerHTML = `<i class="far fa-calendar"></i> ${this.formatDate(date)}`;
        document.getElementById('previewContent').innerHTML = this.markdownToHtml(content);

        const modal = document.getElementById('previewModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 渲染博客列表
    renderBlogList() {
        const blogGrid = document.getElementById('blogGrid');
        if (!blogGrid) return;

        const publishedArticles = this.articles
            .filter(article => article.published)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (publishedArticles.length === 0) {
            blogGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-pen-nib" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-light); font-size: 1.1rem;">还没有发布任何文章，<a href="#write" style="color: var(--accent-color);">开始写第一篇文章吧</a>！</p>
                </div>
            `;
            return;
        }

        const displayedArticles = publishedArticles.slice(0, this.currentPage * this.articlesPerPage);
        
        blogGrid.innerHTML = displayedArticles.map(article => `
            <article class="blog-card" data-id="${article.id}">
                <div class="blog-image">
                    <div class="blog-placeholder">
                        <i class="fas fa-${this.getCategoryIcon(article.category)}"></i>
                    </div>
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-date"><i class="far fa-calendar"></i> ${this.formatDate(article.date)}</span>
                        <span class="blog-category">${article.category}</span>
                    </div>
                    <h3 class="blog-title">${this.escapeHtml(article.title)}</h3>
                    <p class="blog-excerpt">${this.escapeHtml(article.excerpt)}</p>
                    <a href="#" class="blog-read-more" data-id="${article.id}">阅读更多 <i class="fas fa-arrow-right"></i></a>
                </div>
            </article>
        `).join('');

        // 添加点击事件
        blogGrid.querySelectorAll('.blog-read-more').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = parseInt(link.getAttribute('data-id'));
                this.viewArticle(id);
            });
        });

        // 显示/隐藏"加载更多"按钮
        const blogMore = document.getElementById('blogMore');
        if (publishedArticles.length > displayedArticles.length) {
            blogMore.style.display = 'block';
        } else {
            blogMore.style.display = 'none';
        }
    }

    // 加载更多文章
    loadMoreArticles() {
        this.currentPage++;
        this.renderBlogList();
    }

    // 查看文章
    viewArticle(id) {
        const article = this.articles.find(a => a.id === id);
        if (!article) {
            alert('文章不存在！');
            return;
        }

        document.getElementById('modalTitle').textContent = article.title;
        document.getElementById('modalDate').innerHTML = `<i class="far fa-calendar"></i> ${this.formatDate(article.date)}`;
        document.getElementById('modalCategory').textContent = article.category;
        document.getElementById('modalContent').innerHTML = this.markdownToHtml(article.content);

        const modal = document.getElementById('articleModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // 存储当前查看的文章ID
        modal.setAttribute('data-article-id', id);
    }

    // 编辑当前文章
    editCurrentArticle() {
        const modal = document.getElementById('articleModal');
        const articleId = modal.getAttribute('data-article-id');
        if (articleId) {
            this.closeModals();
            window.location.hash = `#write?edit=${articleId}`;
            this.loadArticleForEdit(parseInt(articleId));
        }
    }

    // 删除当前文章
    deleteCurrentArticle() {
        const modal = document.getElementById('articleModal');
        const articleId = modal.getAttribute('data-article-id');
        if (articleId && confirm('确定要删除这篇文章吗？此操作不可恢复！')) {
            this.articles = this.articles.filter(a => a.id !== parseInt(articleId));
            this.saveArticles();
            this.renderBlogList();
            this.closeModals();
            alert('文章已删除！');
        }
    }

    // 加载文章用于编辑
    loadArticleForEdit(id) {
        const article = this.articles.find(a => a.id === id);
        if (!article) {
            alert('文章不存在！');
            window.location.hash = '#write';
            return;
        }

        this.currentEditingId = id;
        const titleInput = document.getElementById('articleTitle');
        const categoryInput = document.getElementById('articleCategory');
        const dateInput = document.getElementById('articleDate');
        const excerptInput = document.getElementById('articleExcerpt');
        const contentInput = document.getElementById('articleContent');

        if (titleInput) titleInput.value = article.title;
        if (categoryInput) categoryInput.value = article.category;
        if (dateInput) dateInput.value = article.date;
        if (excerptInput) excerptInput.value = article.excerpt || '';
        if (contentInput) contentInput.value = article.content;

        // 滚动到编辑区域
        setTimeout(() => {
            const writeSection = document.getElementById('write');
            if (writeSection) {
                writeSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 300);
    }

    // 重置表单
    resetForm() {
        document.getElementById('articleForm').reset();
        this.currentEditingId = null;
        this.setDefaultDate();
    }

    // 关闭所有模态框
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
    }

    // 获取分类图标
    getCategoryIcon(category) {
        const icons = {
            '技术': 'cog',
            '编程': 'code',
            '思考': 'lightbulb',
            '生活': 'heart',
            '学习': 'book',
            '其他': 'pen-nib'
        };
        return icons[category] || 'pen-nib';
    }

    // Markdown转HTML（简单实现）
    markdownToHtml(markdown) {
        if (!markdown) return '';
        
        let html = markdown;

        // 代码块（先处理，避免被其他规则影响）
        html = html.replace(/```([\s\S]*?)```/gim, (match, code) => {
            return `<pre><code>${this.escapeHtml(code.trim())}</code></pre>`;
        });

        // 行内代码
        html = html.replace(/`([^`\n]+)`/gim, '<code>$1</code>');

        // 分割成行处理
        const lines = html.split('\n');
        const result = [];
        let inList = false;
        let listItems = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 空行
            if (!line) {
                if (inList && listItems.length > 0) {
                    result.push(`<ul>${listItems.join('')}</ul>`);
                    listItems = [];
                    inList = false;
                }
                result.push('');
                continue;
            }

            // 标题
            if (line.match(/^#{1,6}\s+/)) {
                if (inList && listItems.length > 0) {
                    result.push(`<ul>${listItems.join('')}</ul>`);
                    listItems = [];
                    inList = false;
                }
                const level = line.match(/^(#{1,6})/)[1].length;
                const text = line.replace(/^#{1,6}\s+/, '');
                result.push(`<h${level}>${this.processInlineMarkdown(text)}</h${level}>`);
                continue;
            }

            // 列表项
            if (line.match(/^[\*\-\+]\s+/) || line.match(/^\d+\.\s+/)) {
                if (!inList) {
                    inList = true;
                }
                const text = line.replace(/^[\*\-\+]\s+/, '').replace(/^\d+\.\s+/, '');
                listItems.push(`<li>${this.processInlineMarkdown(text)}</li>`);
                continue;
            }

            // 引用
            if (line.match(/^>\s+/)) {
                if (inList && listItems.length > 0) {
                    result.push(`<ul>${listItems.join('')}</ul>`);
                    listItems = [];
                    inList = false;
                }
                const text = line.replace(/^>\s+/, '');
                result.push(`<blockquote>${this.processInlineMarkdown(text)}</blockquote>`);
                continue;
            }

            // 普通段落
            if (inList && listItems.length > 0) {
                result.push(`<ul>${listItems.join('')}</ul>`);
                listItems = [];
                inList = false;
            }
            
            if (line && !line.startsWith('<')) {
                result.push(`<p>${this.processInlineMarkdown(line)}</p>`);
            } else {
                result.push(line);
            }
        }

        // 处理剩余的列表
        if (inList && listItems.length > 0) {
            result.push(`<ul>${listItems.join('')}</ul>`);
        }

        return result.join('\n').replace(/\n{3,}/g, '\n\n');
    }

    // 处理行内Markdown
    processInlineMarkdown(text) {
        // 链接
        text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        
        // 粗体
        text = text.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        text = text.replace(/__(.*?)__/gim, '<strong>$1</strong>');
        
        // 斜体
        text = text.replace(/\*(.*?)\*/gim, '<em>$1</em>');
        text = text.replace(/_(.*?)_/gim, '<em>$1</em>');
        
        return text;
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化博客管理器
document.addEventListener('DOMContentLoaded', () => {
    window.blogManager = new BlogManager();
});

