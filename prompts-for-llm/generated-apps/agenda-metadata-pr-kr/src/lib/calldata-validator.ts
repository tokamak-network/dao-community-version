import { ethers } from 'ethers'

export interface FunctionParameter {
  name: string
  type: string
  value: string
}

export interface CallDataValidationResult {
  isValid: boolean
  generated: string
  original: string
  error?: string
}

export class CallDataValidator {
  static parseFunctionSignature(signature: string): { name: string; inputs: { name: string; type: string }[] } | null {
    try {
      const match = signature.match(/^(\w+)\(([^)]*)\)$/)
      if (!match) return null

      const [, name, paramsStr] = match
      if (!paramsStr.trim()) return { name, inputs: [] }

      const paramTypes = paramsStr.split(',').map(p => p.trim())
      const inputs = paramTypes.map((type, index) => ({
        name: `param${index}`,
        type
      }))

      return { name, inputs }
    } catch {
      return null
    }
  }

  static validateParameterValue(type: string, value: string): { isValid: boolean; error?: string } {
    if (!value.trim()) return { isValid: false, error: 'Value cannot be empty' }

    switch (type) {
      case 'address':
        return /^0x[a-fA-F0-9]{40}$/.test(value)
          ? { isValid: true }
          : { isValid: false, error: 'Invalid address format' }

      case 'uint256':
      case 'uint':
        return /^\d+$/.test(value)
          ? { isValid: true }
          : { isValid: false, error: 'Must be a positive integer' }

      case 'bool':
        return (value === 'true' || value === 'false')
          ? { isValid: true }
          : { isValid: false, error: 'Must be true or false' }

      default:
        return { isValid: true }
    }
  }

  static generateCallData(contractAddress: string, functionSignature: string, parameters: FunctionParameter[]): string {
    const parsed = this.parseFunctionSignature(functionSignature)
    if (!parsed) throw new Error('Invalid function signature')

    const functionAbi = {
      name: parsed.name,
      type: 'function',
      inputs: parsed.inputs
    }

    const iface = new ethers.Interface([functionAbi])

    const values = parameters.map((param, index) => {
      const type = parsed.inputs[index]?.type
      if (!type) throw new Error(`Missing type for parameter ${index}`)
      return this.convertParameterValue(type, param.value)
    })

    return iface.encodeFunctionData(parsed.name, values)
  }

  private static convertParameterValue(type: string, value: string): unknown {
    switch (type) {
      case 'address': return value
      case 'uint256':
      case 'uint': return ethers.getBigInt(value)
      case 'int256':
      case 'int': return ethers.getBigInt(value)
      case 'bool': return value === 'true'
      case 'string': return value
      case 'bytes': return value
      default:
        if (type.endsWith('[]')) {
          const arrayValue = JSON.parse(value)
          const baseType = type.slice(0, -2)
          return arrayValue.map((item: unknown) => this.convertParameterValue(baseType, String(item)))
        }
        return value
    }
  }

  static validateCallData(
    contractAddress: string,
    functionSignature: string,
    parameters: FunctionParameter[],
    originalCallData: string
  ): CallDataValidationResult {
    try {
      const generated = this.generateCallData(contractAddress, functionSignature, parameters)

      return {
        isValid: generated.toLowerCase() === originalCallData.toLowerCase(),
        generated,
        original: originalCallData
      }
    } catch (error) {
      return {
        isValid: false,
        generated: '',
        original: originalCallData,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}