import { useState, useRef } from 'react'
import { parsePDF, type ParseResult } from './pdfParser'
import { analyzeTransactions, type AnalysisResult } from './analyzer'

function App() {
  const [files, setFiles] = useState<File[]>([])
  const [parsing, setParsing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async () => {
    if (!files.length) return
    
    setParsing(true)
    setProgress(0)
    setError('')
    setResult(null)

    try {
      const allTransactions: any[] = []
      let accountInfo: any = null

      for (let i = 0; i < files.length; i++) {
        setProgress(Math.round((i / files.length) * 50))
        
        const parseResult: ParseResult = await parsePDF(files[i], (p) => {
          setProgress(Math.round((i / files.length) * 50 + p * 0.5))
        })
        
        if (!accountInfo && parseResult.accountInfo.name) {
          accountInfo = parseResult.accountInfo
        }
        allTransactions.push(...parseResult.transactions)
      }

      setProgress(60)

      if (allTransactions.length === 0) {
        throw new Error('未找到任何交易记录')
      }

      const analysis = await analyzeTransactions(allTransactions)
      setResult(analysis)
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
    setFiles(prev => [...prev, ...droppedFiles])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <header className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-2">🍊 橙子账单分析系统</h1>
          <p className="text-orange-100">上传微信账单 PDF，智能分析财务状况</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div 
          className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-dashed border-orange-200 hover:border-orange-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={e => setFiles(Array.from(e.target.files || []))}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              选择 PDF 文件
            </button>
            <p className="text-gray-500 mt-4">或拖拽微信账单 PDF 到此处</p>
            
            {files.length > 0 && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                <p className="font-medium text-orange-800">已选择 {files.length} 个文件</p>
                <button
                  onClick={handleFileSelect}
                  disabled={parsing}
                  className="mt-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold"
                >
                  {parsing ? '分析中...' : '开始分析'}
                </button>
              </div>
            )}

            {parsing && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-orange-500 h-4 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-gray-600 mt-2">正在分析... {progress}%</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">❌ {error}</p>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 分析结果</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-600 text-sm">总收入</p>
                  <p className="text-2xl font-bold text-green-700">¥{result.overview.totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-600 text-sm">总支出</p>
                  <p className="text-2xl font-bold text-red-700">¥{result.overview.totalExpense.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-600 text-sm">交易笔数</p>
                  <p className="text-2xl font-bold text-blue-700">{result.overview.totalTransactions}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-purple-600 text-sm">用户评分</p>
                  <p className="text-2xl font-bold text-purple-700">{result.customerScore.grade}</p>
                </div>
              </div>
            </div>

            {result.regularTransfers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🔄 规律转账</h3>
                {result.regularTransfers.map((t, i) => (
                  <div key={i} className="p-4 bg-yellow-50 rounded-lg mb-2">
                    <p className="font-medium">{t.counterpart}</p>
                    <p className="text-sm text-gray-600">{t.pattern} · ¥{t.avgAmount.toLocaleString()} · 置信度{Math.round(t.confidence * 100)}%</p>
                  </div>
                ))}
              </div>
            )}

            {result.loanDetection.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">💰 借款排查</h3>
                {result.loanDetection.map((l, i) => (
                  <div key={i} className="p-4 bg-red-50 rounded-lg mb-2">
                    <p className="font-medium">{l.counterpart}</p>
                    <p className="text-sm text-gray-600">借款 ¥{l.totalBorrowed.toLocaleString()} · 已还 ¥{l.totalRepaid.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-gray-500">
        <p>所有数据仅在浏览器中处理，不会上传至任何服务器</p>
      </footer>
    </div>
  )
}

export default App
