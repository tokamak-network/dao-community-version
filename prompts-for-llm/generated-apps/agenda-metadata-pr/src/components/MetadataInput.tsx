'use client'

import { useState, useEffect, useCallback } from 'react'
import { ParsedTransaction, AgendaMetadata, Action } from '@/types/agenda'
import { ActionEditor } from './ActionEditor'
import { ERROR_MESSAGES } from '@/lib/utils'

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
  const [actions, setActions] = useState<Partial<Action>[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    const initialActions = parsedTransaction.targets.map((target, index) => ({
      contractAddress: target,
      calldata: parsedTransaction.calldatas[index] || '',
      title: `Action ${index + 1}`,
      method: '',
      abi: []
    }))
    setActions(initialActions)
  }, [parsedTransaction])

  const updateAction = useCallback((index: number, action: Partial<Action>) => {
    setActions(prev => {
      const newActions = [...prev]
      newActions[index] = action
      return newActions
    })
  }, [])

  const validateAndProceed = () => {
    const errors: string[] = []
    
    if (!title.trim()) {
      errors.push(ERROR_MESSAGES.MISSING_TITLE)
    }
    
    if (!description.trim()) {
      errors.push(ERROR_MESSAGES.MISSING_DESCRIPTION)
    }
    
    actions.forEach((action, index) => {
      if (!action.contractAddress) {
        errors.push(`Action ${index + 1}: Contract address is required`)
      }
      if (!action.method) {
        errors.push(`Action ${index + 1}: Function signature is required`)
      }
    })
    
    if (errors.length > 0) {
      setValidationErrors(errors)
      onError(errors.join(', '))
      return
    }
    
    const metadata: Partial<AgendaMetadata> = {
      id: parsedTransaction.agendaId,
      title,
      description,
      network: parsedTransaction.network,
      transaction: parsedTransaction.txHash,
      creator: {
        address: parsedTransaction.from,
        signature: ''
      },
      actions: actions as Action[],
      snapshotUrl: snapshotUrl || undefined,
      discourseUrl: discourseUrl || undefined
    }
    
    onMetadataComplete(metadata)
  }

  const jsonPreview = {
    id: parsedTransaction.agendaId,
    title,
    description,
    network: parsedTransaction.network,
    transaction: parsedTransaction.txHash,
    creator: {
      address: parsedTransaction.from,
      signature: '(will be generated)'
    },
    actions: actions.map(a => ({
      title: a.title,
      contractAddress: a.contractAddress,
      method: a.method,
      calldata: a.calldata,
      abi: a.abi
    })),
    createdAt: '(will be generated)',
    snapshotUrl: snapshotUrl || undefined,
    discourseUrl: discourseUrl || undefined
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Step 2: Metadata Input</h2>
        <p className="text-gray-600 mb-6">
          Enter metadata information for agenda #{parsedTransaction.agendaId}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agenda Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter agenda title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter detailed description"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Snapshot URL {parsedTransaction.memoUrl && '(Auto-parsed)'}
            </label>
            <input
              type="text"
              value={snapshotUrl}
              onChange={(e) => setSnapshotUrl(e.target.value)}
              placeholder="https://snapshot.org/#/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {parsedTransaction.memoUrl && (
              <p className="text-xs text-gray-500 mt-1">
                Memo URL found: {parsedTransaction.memoUrl}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discourse URL
            </label>
            <input
              type="text"
              value={discourseUrl}
              onChange={(e) => setDiscourseUrl(e.target.value)}
              placeholder="https://forum.tokamak.network/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            JSON Preview
          </label>
          <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto h-96">
            {JSON.stringify(jsonPreview, null, 2)}
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Actions</h3>
        {actions.map((action, index) => (
          <ActionEditor
            key={index}
            index={index}
            action={action}
            originalCalldata={parsedTransaction.calldatas[index] || ''}
            onUpdate={(updatedAction) => updateAction(index, updatedAction)}
          />
        ))}
      </div>

      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="font-medium text-red-800 mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside text-sm text-red-600">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={validateAndProceed}
        className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Proceed to Signature
      </button>
    </div>
  )
}