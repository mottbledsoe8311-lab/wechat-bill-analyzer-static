import { useState, useRef } from 'react'
import { parsePDF, type ParseResult } from './pdfParser'

function App() {
  const [files, setFiles] = useState<File[]>([])
  const [parsing, setParsing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async () => {
    if (!files.length) return
    
    setParsing(true)
    setProgress(0)
    setError('')
    setResult(null)

    try {
      const parseResult: ParseResult = await parsePDF(files[0], (p) => {
        setProgress(p)
      })
      
      setResult(parseResult)
      setProgress(100)
    } catch (e: any) {
      setError(e.message || '解析失败')
    } finally {
      setParsing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      f => f.name.endsWith('.pdf')
    )
    setFiles(droppedFiles)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #fff7ed, #ffedd5)', padding: '20px' }}>
      <header style={{ background: 'linear-gradient(to right, #f97316, #f59e0b)', color: 'white', padding: '32px 16px', textAlign: 'center', borderRadius: '16px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>🍊 橙子账单分析系统</h1>
        <p style={{ opacity: 0.9 }}>上传微信账单 PDF，智能分析财务状况</p>
      </header>

      <main style={{ maxWidth: '56rem', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginTop: '24px', border: '2px dashed #fed7aa', textAlign: 'center' }}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📄</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => setFiles(Array.from(e.target.files || []))}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ background: '#f97316', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            选择 PDF 文件
          </button>
          <p style={{ color: '#6b7280', marginTop: '16px' }}>或拖拽微信账单 PDF 到此处</p>
          
          {files.length > 0 && (
            <div style={{ marginTop: '16px', padding: '16px', background: '#fff7ed', borderRadius: '8px' }}>
              <p style={{ fontWeight: '500', color: '#c2410c' }}>已选择: {files[0].name}</p>
              <button
                onClick={handleFileSelect}
                disabled={parsing}
                style={{ marginTop: '16px', background: '#f97316', color: 'white', padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
              >
                {parsing ? '解析中...' : '开始解析'}
              </button>
            </div>
          )}

          {parsing && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ width: '100%', background: '#e5e7eb', borderRadius: '9999px', height: '16px' }}>
                <div style={{ background: '#f97316', height: '100%', borderRadius: '9999px', width: `${progress}%`, transition: 'width 0.3s' }} />
              </div>
              <p style={{ color: '#6b7280', marginTop: '8px' }}>正在解析... {progress}%</p>
            </div>
          )}

          {error && (
            <div style={{ marginTop: '16px', padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>
              ❌ {error}
            </div>
          )}
        </div>

        {result && (
          <div style={{ marginTop: '24px', background: 'white', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>📊 解析结果</h2>
            <p><strong>账户名：</strong>{result.accountInfo.name || '未知'}</p>
            <p><strong>交易记录数：</strong>{result.transactions.length}</p>
            {result.parseErrors.length > 0 && (
              <p style={{ color: '#dc2626' }}><strong>解析错误：</strong>{result.parseErrors.length} 条</p>
            )}
            <div style={{ marginTop: '16px', maxHeight: '300px', overflow: 'auto' }}>
              <h3 style={{ marginBottom: '8px' }}>最近交易记录：</h3>
              {result.transactions.slice(0, 10).map((t: any, i: number) => (
                <div key={i} style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px', marginBottom: '4px', fontSize: '0.875rem' }}>
                  {t.date} - {t.counterparty} - ¥{t.amount} ({t.type === 'income' ? '收入' : '支出'})
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
        <p>所有数据仅在浏览器中处理，不会上传至任何服务器</p>
      </footer>
    </div>
  )
}

export default App
