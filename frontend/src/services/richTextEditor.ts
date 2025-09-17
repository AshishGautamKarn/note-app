export interface RichTextFormat {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  code: boolean
  link: string | null
  color: string | null
  backgroundColor: string | null
  fontSize: number | null
  fontFamily: string | null
  alignment: 'left' | 'center' | 'right' | 'justify'
  listType: 'none' | 'bullet' | 'number' | 'check'
  indent: number
  quote: boolean
}

export interface TextSelection {
  start: number
  end: number
  text: string
}

export class RichTextEditorService {
  private static readonly DEFAULT_FORMAT: RichTextFormat = {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    link: null,
    color: null,
    backgroundColor: null,
    fontSize: null,
    fontFamily: null,
    alignment: 'left',
    listType: 'none',
    indent: 0,
    quote: false
  }

  /**
   * Get current text selection
   */
  static getSelection(): TextSelection | null {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null

    const range = selection.getRangeAt(0)
    const text = selection.toString()
    
    return {
      start: range.startOffset,
      end: range.endOffset,
      text
    }
  }

  /**
   * Apply formatting to selected text
   */
  static applyFormat(format: Partial<RichTextFormat>): void {
    const selection = this.getSelection()
    if (!selection || !selection.text) return

    // Create a new range for the selection
    const range = window.getSelection()?.getRangeAt(0)
    if (!range) return

    // Create a span element with the formatting
    const span = document.createElement('span')
    
    // Apply text formatting
    if (format.bold) span.style.fontWeight = 'bold'
    if (format.italic) span.style.fontStyle = 'italic'
    if (format.underline) span.style.textDecoration = 'underline'
    if (format.strikethrough) span.style.textDecoration = 'line-through'
    if (format.code) {
      span.style.fontFamily = 'monospace'
      span.style.backgroundColor = '#f1f5f9'
      span.style.padding = '2px 4px'
      span.style.borderRadius = '3px'
    }
    if (format.color) span.style.color = format.color
    if (format.backgroundColor) span.style.backgroundColor = format.backgroundColor
    if (format.fontSize) span.style.fontSize = `${format.fontSize}px`
    if (format.fontFamily) span.style.fontFamily = format.fontFamily

    // Wrap the selected text
    try {
      range.surroundContents(span)
    } catch (error) {
      // If surroundContents fails, use extractContents and insertNode
      const contents = range.extractContents()
      span.appendChild(contents)
      range.insertNode(span)
    }
  }

  /**
   * Apply link to selected text
   */
  static applyLink(url: string): void {
    const selection = this.getSelection()
    if (!selection || !selection.text) return

    const range = window.getSelection()?.getRangeAt(0)
    if (!range) return

    const link = document.createElement('a')
    link.href = url
    link.textContent = selection.text
    link.target = '_blank'
    link.rel = 'noopener noreferrer'

    try {
      range.surroundContents(link)
    } catch (error) {
      const contents = range.extractContents()
      link.appendChild(contents)
      range.insertNode(link)
    }
  }

  /**
   * Apply list formatting
   */
  static applyList(listType: 'bullet' | 'number' | 'check'): void {
    const selection = this.getSelection()
    if (!selection) return

    const range = window.getSelection()?.getRangeAt(0)
    if (!range) return

    let listElement: HTMLUListElement | HTMLOListElement
    
    if (listType === 'bullet') {
      listElement = document.createElement('ul')
    } else if (listType === 'number') {
      listElement = document.createElement('ol')
    } else {
      listElement = document.createElement('ul')
      listElement.style.listStyleType = 'none'
    }

    const listItem = document.createElement('li')
    
    if (listType === 'check') {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.style.marginRight = '8px'
      listItem.appendChild(checkbox)
    }

    if (selection.text) {
      listItem.appendChild(document.createTextNode(selection.text))
    } else {
      listItem.appendChild(document.createTextNode('• '))
    }

    listElement.appendChild(listItem)

    try {
      range.surroundContents(listElement)
    } catch (error) {
      const contents = range.extractContents()
      listElement.appendChild(contents)
      range.insertNode(listElement)
    }
  }

  /**
   * Apply quote formatting
   */
  static applyQuote(): void {
    const selection = this.getSelection()
    if (!selection) return

    const range = window.getSelection()?.getRangeAt(0)
    if (!range) return

    const blockquote = document.createElement('blockquote')
    blockquote.style.borderLeft = '4px solid #e2e8f0'
    blockquote.style.paddingLeft = '16px'
    blockquote.style.marginLeft = '0'
    blockquote.style.fontStyle = 'italic'
    blockquote.style.color = '#64748b'

    if (selection.text) {
      blockquote.appendChild(document.createTextNode(selection.text))
    } else {
      blockquote.appendChild(document.createTextNode('Quote text here...'))
    }

    try {
      range.surroundContents(blockquote)
    } catch (error) {
      const contents = range.extractContents()
      blockquote.appendChild(contents)
      range.insertNode(blockquote)
    }
  }

  /**
   * Apply code block formatting
   */
  static applyCodeBlock(): void {
    const selection = this.getSelection()
    if (!selection) return

    const range = window.getSelection()?.getRangeAt(0)
    if (!range) return

    const pre = document.createElement('pre')
    const code = document.createElement('code')
    
    pre.style.backgroundColor = '#f8fafc'
    pre.style.border = '1px solid #e2e8f0'
    pre.style.borderRadius = '6px'
    pre.style.padding = '16px'
    pre.style.overflow = 'auto'
    pre.style.fontFamily = 'monospace'
    pre.style.fontSize = '14px'
    pre.style.lineHeight = '1.5'

    if (selection.text) {
      code.appendChild(document.createTextNode(selection.text))
    } else {
      code.appendChild(document.createTextNode('// Code goes here...'))
    }

    pre.appendChild(code)

    try {
      range.surroundContents(pre)
    } catch (error) {
      const contents = range.extractContents()
      pre.appendChild(contents)
      range.insertNode(pre)
    }
  }

  /**
   * Apply heading formatting
   */
  static applyHeading(level: 1 | 2 | 3 | 4 | 5 | 6): void {
    const selection = this.getSelection()
    if (!selection) return

    const range = window.getSelection()?.getRangeAt(0)
    if (!range) return

    const heading = document.createElement(`h${level}`)
    
    // Apply heading styles
    const sizes = { 1: '2rem', 2: '1.5rem', 3: '1.25rem', 4: '1.125rem', 5: '1rem', 6: '0.875rem' }
    heading.style.fontSize = sizes[level]
    heading.style.fontWeight = 'bold'
    heading.style.margin = '16px 0 8px 0'
    heading.style.lineHeight = '1.2'

    if (selection.text) {
      heading.appendChild(document.createTextNode(selection.text))
    } else {
      heading.appendChild(document.createTextNode(`Heading ${level}`))
    }

    try {
      range.surroundContents(heading)
    } catch (error) {
      const contents = range.extractContents()
      heading.appendChild(contents)
      range.insertNode(heading)
    }
  }

  /**
   * Insert horizontal rule
   */
  static insertHorizontalRule(): void {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const hr = document.createElement('hr')
    hr.style.border = 'none'
    hr.style.borderTop = '1px solid #e2e8f0'
    hr.style.margin = '16px 0'

    range.insertNode(hr)
  }

  /**
   * Insert table
   */
  static insertTable(rows: number = 3, cols: number = 3): void {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const table = document.createElement('table')
    table.style.borderCollapse = 'collapse'
    table.style.width = '100%'
    table.style.margin = '16px 0'

    // Create header row
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    headerRow.style.backgroundColor = '#f8fafc'
    
    for (let i = 0; i < cols; i++) {
      const th = document.createElement('th')
      th.style.border = '1px solid #e2e8f0'
      th.style.padding = '8px 12px'
      th.style.textAlign = 'left'
      th.appendChild(document.createTextNode(`Header ${i + 1}`))
      headerRow.appendChild(th)
    }
    
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Create body rows
    const tbody = document.createElement('tbody')
    for (let i = 0; i < rows - 1; i++) {
      const tr = document.createElement('tr')
      
      for (let j = 0; j < cols; j++) {
        const td = document.createElement('td')
        td.style.border = '1px solid #e2e8f0'
        td.style.padding = '8px 12px'
        td.appendChild(document.createTextNode(`Cell ${i + 1},${j + 1}`))
        tr.appendChild(td)
      }
      
      tbody.appendChild(tr)
    }
    
    table.appendChild(tbody)
    range.insertNode(table)
  }

  /**
   * Get current formatting state
   */
  static getCurrentFormat(): RichTextFormat {
    const selection = this.getSelection()
    if (!selection || !selection.text) return this.DEFAULT_FORMAT

    // This is a simplified version - in a real implementation,
    // you'd traverse the DOM to determine the current formatting
    return { ...this.DEFAULT_FORMAT }
  }

  /**
   * Clear all formatting
   */
  static clearFormatting(): void {
    const selection = this.getSelection()
    if (!selection || !selection.text) return

    const range = window.getSelection()?.getRangeAt(0)
    if (!range) return

    const textNode = document.createTextNode(selection.text)
    range.deleteContents()
    range.insertNode(textNode)
  }

  /**
   * Convert HTML to markdown (simplified)
   */
  static htmlToMarkdown(html: string): string {
    let markdown = html

    // Convert headings
    markdown = markdown.replace(/<h([1-6])>(.*?)<\/h[1-6]>/g, (match, level, text) => {
      return '#'.repeat(parseInt(level)) + ' ' + text + '\n'
    })

    // Convert bold
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**')

    // Convert italic
    markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*')
    markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*')

    // Convert code
    markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`')

    // Convert links
    markdown = markdown.replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')

    // Convert lists
    markdown = markdown.replace(/<ul>(.*?)<\/ul>/gs, (match, content) => {
      return content.replace(/<li>(.*?)<\/li>/g, '- $1\n')
    })

    markdown = markdown.replace(/<ol>(.*?)<\/ol>/gs, (match, content) => {
      let counter = 1
      return content.replace(/<li>(.*?)<\/li>/g, () => `${counter++}. $1\n`)
    })

    // Convert blockquotes
    markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/gs, (match, content) => {
      return '> ' + content.replace(/\n/g, '\n> ') + '\n'
    })

    // Convert code blocks
    markdown = markdown.replace(/<pre><code>(.*?)<\/code><\/pre>/gs, (match, content) => {
      return '```\n' + content + '\n```\n'
    })

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]*>/g, '')

    return markdown
  }

  /**
   * Convert markdown to HTML (simplified)
   */
  static markdownToHtml(markdown: string): string {
    let html = markdown

    // Convert headings
    html = html.replace(/^(#{1,6})\s+(.*)$/gm, (match, hashes, text) => {
      const level = hashes.length
      return `<h${level}>${text}</h${level}>`
    })

    // Convert bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // Convert italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

    // Convert code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>')

    // Convert links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

    // Convert lists
    html = html.replace(/^-\s+(.*)$/gm, '<li>$1</li>')
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

    // Convert blockquotes
    html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>')

    // Convert code blocks
    html = html.replace(/```\n(.*?)\n```/gs, '<pre><code>$1</code></pre>')

    // Convert line breaks
    html = html.replace(/\n/g, '<br>')

    return html
  }

  /**
   * Get available fonts
   */
  static getAvailableFonts(): string[] {
    return [
      'Inter',
      'Arial',
      'Helvetica',
      'Times New Roman',
      'Georgia',
      'Verdana',
      'Courier New',
      'Monaco',
      'Trebuchet MS',
      'Arial Black',
      'Impact',
      'Comic Sans MS'
    ]
  }

  /**
   * Get available colors
   */
  static getAvailableColors(): string[] {
    return [
      '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
      '#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#0066ff', '#6600ff',
      '#ff0066', '#ff3366', '#ff6699', '#ff99cc', '#ffccff', '#cc99ff',
      '#9966ff', '#6633ff', '#3300ff', '#0066cc', '#0099ff', '#00ccff',
      '#00ffff', '#00ffcc', '#00ff99', '#00ff66', '#00ff33', '#00ff00'
    ]
  }
}
