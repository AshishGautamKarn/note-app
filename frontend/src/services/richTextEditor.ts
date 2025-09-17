export interface RichTextFormat {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  code: boolean
  link?: string
  listType?: 'bullet' | 'number' | 'none'
  heading?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'none'
}

export class RichTextEditorService {
  static formatText(text: string, format: RichTextFormat): string {
    let formattedText = text

    // Apply heading
    if (format.heading && format.heading !== 'none') {
      const headingLevel = format.heading.replace('h', '')
      formattedText = `<${format.heading}>${formattedText}</${format.heading}>`
    }

    // Apply code formatting
    if (format.code) {
      formattedText = `<code>${formattedText}</code>`
    }

    // Apply strikethrough
    if (format.strikethrough) {
      formattedText = `<del>${formattedText}</del>`
    }

    // Apply underline
    if (format.underline) {
      formattedText = `<u>${formattedText}</u>`
    }

    // Apply italic
    if (format.italic) {
      formattedText = `<em>${formattedText}</em>`
    }

    // Apply bold
    if (format.bold) {
      formattedText = `<strong>${formattedText}</strong>`
    }

    // Apply link
    if (format.link) {
      formattedText = `<a href="${format.link}" target="_blank" rel="noopener noreferrer">${formattedText}</a>`
    }

    return formattedText
  }

  static convertToMarkdown(html: string): string {
    let markdown = html

    // Convert HTML to Markdown
    markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
    markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
    markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
    markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n')
    markdown = markdown.replace(/<h5>(.*?)<\/h5>/g, '##### $1\n')
    markdown = markdown.replace(/<h6>(.*?)<\/h6>/g, '###### $1\n')
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*')
    markdown = markdown.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
    markdown = markdown.replace(/<del>(.*?)<\/del>/g, '~~$1~~')
    markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`')
    markdown = markdown.replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    markdown = markdown.replace(/<br\s*\/?>/g, '\n')
    markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n\n')

    return markdown.trim()
  }

  static convertToPlainText(html: string): string {
    // Remove HTML tags and convert to plain text
    let text = html
    text = text.replace(/<[^>]*>/g, '')
    text = text.replace(/&nbsp;/g, ' ')
    text = text.replace(/&amp;/g, '&')
    text = text.replace(/&lt;/g, '<')
    text = text.replace(/&gt;/g, '>')
    text = text.replace(/&quot;/g, '"')
    text = text.replace(/&#39;/g, "'")
    return text.trim()
  }

  static extractLinks(html: string): string[] {
    const linkRegex = /<a[^>]+href="([^"]*)"[^>]*>/g
    const links: string[] = []
    let match

    while ((match = linkRegex.exec(html)) !== null) {
      links.push(match[1])
    }

    return links
  }

  static getWordCount(html: string): number {
    const plainText = this.convertToPlainText(html)
    return plainText.split(/\s+/).filter(word => word.length > 0).length
  }

  static sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in a real app, you'd use a library like DOMPurify
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'del', 'code', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li']
    const allowedAttributes = ['href', 'target', 'rel']
    
    // This is a simplified sanitization - in production, use a proper library
    return html.replace(/<script[^>]*>.*?<\/script>/gi, '')
               .replace(/<style[^>]*>.*?<\/style>/gi, '')
               .replace(/on\w+="[^"]*"/gi, '')
  }
}