/**
 * Script to generate the MSA (Measurement System Analysis) Excel template
 * Run with: node scripts/generate-msa-template.mjs
 */

import * as XLSX from 'xlsx'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

// MSA Template data - 10 parts, 3 operators, 3 measurements per combination
const parts = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const operators = ['A', 'B', 'C']

// Generate realistic manufacturing measurement data
// Base value around 10.00mm with variation
function generateMeasurement(baseValue) {
  // Measurement system variation (about 0.02-0.08 typical for good MSA)
  const variation = (Math.random() - 0.5) * 0.12
  return Number((baseValue + variation).toFixed(3))
}

// Generate part-specific base values with some variation between parts
function getPartBaseValue(partIndex) {
  // Parts vary from about 9.95 to 10.15
  const partVariation = (partIndex - 5) * 0.02
  return 10.0 + partVariation
}

// Generate data rows
const data = []

// Header row
data.push(['Part', 'Operator', 'Measurement 1', 'Measurement 2', 'Measurement 3'])

// Generate measurements for each part-operator combination
parts.forEach((part, partIndex) => {
  const baseValue = getPartBaseValue(partIndex)

  operators.forEach(operator => {
    // Add small operator bias (simulates real-world operator differences)
    const operatorBias = operator === 'A' ? 0.01 : operator === 'B' ? -0.005 : 0.005
    const operatorBaseValue = baseValue + operatorBias

    const row = [
      part,
      operator,
      generateMeasurement(operatorBaseValue),
      generateMeasurement(operatorBaseValue),
      generateMeasurement(operatorBaseValue)
    ]
    data.push(row)
  })
})

// Create workbook and worksheet
const workbook = XLSX.utils.book_new()
const worksheet = XLSX.utils.aoa_to_sheet(data)

// Set column widths for better readability
worksheet['!cols'] = [
  { wch: 8 },   // Part
  { wch: 10 },  // Operator
  { wch: 14 },  // Measurement 1
  { wch: 14 },  // Measurement 2
  { wch: 14 }   // Measurement 3
]

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'MSA Data')

// Ensure directory exists
const outputPath = 'public/templates/plantilla-msa.xlsx'
mkdirSync(dirname(outputPath), { recursive: true })

// Write the file
XLSX.writeFile(workbook, outputPath)

console.log(`✅ MSA template created: ${outputPath}`)
console.log(`   - ${parts.length} parts`)
console.log(`   - ${operators.length} operators`)
console.log(`   - ${data.length - 1} data rows (${parts.length * operators.length} combinations)`)
