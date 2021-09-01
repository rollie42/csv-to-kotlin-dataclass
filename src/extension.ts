// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

type KotlinType = {
	name: string
	import?: string
	evalFn: (v: string) => boolean	
}

const kotlinTypes: KotlinType[] = [	
	{
		name: "Int",
		evalFn: (v: string) => v.match(/^-?[0-9]+$/) !== null
	},
	{
		name: "Float",
		evalFn: (v: string) => v.match(/^-?[0-9]*\.?[0-9]+$/) !== null
	},
	{
		name: "Boolean",
		evalFn: (v: string) => v === 'True' || v === 'False'
	},
	{
		name: "Instant", // Date
		import: 'java.time.Instant',
		evalFn: (v: string) => !isNaN(Date.parse(v))
	},
	{
		name: "String",
		evalFn: (v: string) => true
	}
]

export function activate(context: vscode.ExtensionContext) {
	/* test data:
a1,a2,a3
123,asd,2020-10-10
222,,
	*/

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('csv-to-kotlin-dataclass.generateDataClass', async () => {
		const activeFile = vscode.window.activeTextEditor
		if (!activeFile || !activeFile?.document) {
			vscode.window.showErrorMessage("No file is active")
			return
		}
		
		const doc = activeFile?.document!!
		if (doc.languageId !== "csv" && doc.languageId !== "plaintext") {
			vscode.window.showErrorMessage(`Currently active document is type ${doc.languageId}, and not of type 'csv'`)
			return
		}

		const headers = doc
			.lineAt(0)
			.text
			.split(',')
			.map(h => {
				return {
					name: h,
					candidateTypes: [...kotlinTypes],
					nullable: false
				}
			})
			.filter(h => h.name !== '')

		if (headers.length === 0)
			return

		for (let lineIdx = 1; lineIdx < doc.lineCount && lineIdx < 300; lineIdx++) {
			const fields = doc.lineAt(lineIdx).text.split(',')
			for (let fieldIdx = 0; fieldIdx < headers.length; fieldIdx++) {
				const header = headers[fieldIdx]
				const field = fields[fieldIdx]
				if (field === '') {
					header.nullable = true
				} else {
					header.candidateTypes = header.candidateTypes.filter(t => t.evalFn(field))
				}
			}
		}
		const extraImports = headers.map(h => h.candidateTypes[0].import).filter(t => t  !== undefined)
		const uniqueImports = [...new Set(extraImports)]
		const importBlock = `import kotlinx.serialization
${uniqueImports.map(i => `import ${i}`).join("\n")}`

		const dataVarsBlock = headers
			.map(h => `\tval ${h.name}: ${h.candidateTypes[0].name}${h.nullable ? '?' : ''}`)
			.join(',\n')
		
		const dataFileContent = 
`${importBlock}
		
@Serializable
data class CsvItem(
${dataVarsBlock}
)
`

		const dataClassFile = await vscode.workspace.openTextDocument({language: 'kotlin', content: dataFileContent})
		await vscode.window.showTextDocument(dataClassFile)

	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
