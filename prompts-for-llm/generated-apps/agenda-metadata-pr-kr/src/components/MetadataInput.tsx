'use client'

import { useState, useEffect, useCallback } from 'react'
import { ActionEditor } from './ActionEditor'
import { ParsedTransaction } from '@/lib/transaction-parser'
import { AgendaMetadata } from '@/lib/github'

interface MetadataInputProps {
  parsedTransaction: ParsedTransaction
  onMetadataComplete: (metadata: Partial<AgendaMetadata>) => void
  onError: (error: string) => void
}

export function MetadataInput({ 
  parsedTransaction, 
  onMetadataComplete, 
  onError 
}: MetadataInputProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [snapshotUrl, setSnapshotUrl] = useState(parsedTransaction.memoUrl || '')
  const [discourseUrl, setDiscourseUrl] = useState('')
  const [actions, setActions] = useState<any[]>([])
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    // Initialize actions from parsed transaction
    const initialActions = parsedTransaction.targets.map((target, index) => ({
      contractAddress: target,
      calldata: parsedTransaction.calldatas[index] || '0x',
      title: '',
      method: '',
      parameters: [],
      isValid: false
    }))
    setActions(initialActions)
  }, [parsedTransaction])

  const handleActionUpdate = useCallback((index: number, data: any) => {
    const newActions = [...actions]
    newActions[index] = { ...newActions[index], ...data }
    setActions(newActions)
  }, [actions])

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      onError('Agenda title is required')
      return
    }
    if (!description.trim()) {
      onError('Agenda description is required')
      return
    }

    const allActionsValid = actions.every(action => action.isValid || !action.method)

    if (!allActionsValid && actions.some(action => action.method)) {
      onError('Some actions have invalid parameters')
      return
    }

    const metadata: Partial<AgendaMetadata> = {
      id: parsedTransaction.id,
      title,
      description,
      network: parsedTransaction.network,
      transaction: parsedTransaction.transactionHash,
      actions: actions.map((action, index) => ({
        title: action.title || `Action ${index + 1}`,
        contractAddress: action.contractAddress,
        method: action.method || 'unknown',
        calldata: action.calldata
      })),
      snapshotUrl: snapshotUrl || undefined,
      discourseUrl: discourseUrl || undefined
    }

    onMetadataComplete(metadata)
  }, [title, description, snapshotUrl, discourseUrl, actions, parsedTransaction, onMetadataComplete, onError])

  useEffect(() => {
    const allFieldsValid = 
      title.trim() !== '' && 
      description.trim() !== '' &&
      actions.length > 0
    setIsValid(allFieldsValid)
  }, [title, description, actions])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Step 2: Metadata Input</h2>
        <p className="text-gray-600 mb-6">
          Provide metadata information for agenda #{parsedTransaction.id}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Parsed Information</h3>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Agenda ID:</span> {parsedTransaction.id}</p>
          <p><span className="font-medium">Creator:</span> {parsedTransaction.creator}</p>
          <p><span className="font-medium">Network:</span> {parsedTransaction.network}</p>
          <p><span className="font-medium">Actions:</span> {parsedTransaction.targets.length}</p>
          {parsedTransaction.memoUrl && (
            <p><span className="font-medium">Memo URL:</span> {parsedTransaction.memoUrl}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agenda Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter agenda title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agenda Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter detailed description of the agenda"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Snapshot URL {parsedTransaction.memoUrl && '(Auto-filled from memo)'}
          </label>
          <input
            type="url"
            value={snapshotUrl}
            onChange={(e) => setSnapshotUrl(e.target.value)}
            placeholder="https://snapshot.org/#/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discourse URL
          </label>
          <input
            type="url"
            value={discourseUrl}
            onChange={(e) => setDiscourseUrl(e.target.value)}
            placeholder="https://discourse.org/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Actions</h3>
          <div className="space-y-4">
            {actions.map((action, index) => (
              <ActionEditor
                key={index}
                index={index}
                contractAddress={action.contractAddress}
                originalCalldata={action.calldata}
                onUpdate={(data) => handleActionUpdate(index, data)}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            !isValid
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Continue to Signature
        </button>
      </div>

      {/* JSON Preview */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">JSON Preview</h3>
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto text-sm">
          {JSON.stringify({
            id: parsedTransaction.id,
            title,
            description,
            network: parsedTransaction.network,
            transaction: parsedTransaction.transactionHash,
            actions: actions.map((a, i) => ({
              title: a.title || `Action ${i + 1}`,
              contractAddress: a.contractAddress,
              method: a.method || 'unknown',
              calldata: a.calldata
            })),
            snapshotUrl,
            discourseUrl
          }, null, 2)}
        </pre>
      </div>
    </div>
  )
}