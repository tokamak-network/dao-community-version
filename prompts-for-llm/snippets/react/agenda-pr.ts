// Example: Submit Tokamak DAO agenda metadata as a PR using GitHub API (octokit)
import { Octokit } from "@octokit/rest"

interface AgendaMetadata {
  id: number
  title: string
  description: string
  announcementUrl: string
  snapshotUrl?: string
  transactions: {
    targetAddress: string
    functionSignature: string
    parameters: string
    value?: string
  }[]
  noticePeriodSeconds: number
  votingPeriodSeconds: number
  createdAt: string
  creator: string
}

export const submitAgendaPR = async (agendaData: AgendaMetadata, githubToken: string) => {
  const octokit = new Octokit({ auth: githubToken })

  const owner = "tokamak-network"
  const repo = "tokamak-dao-contracts"
  const branch = `agenda-${agendaData.id}-metadata`
  const filePath = `agendas/mainnet/agenda-${agendaData.id}.json`
  const fileContent = JSON.stringify(agendaData, null, 2)

  try {
    // Get the default branch SHA
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/main'
    })

    // Create a new branch
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: ref.object.sha
    })

    // Create/update the file
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `Add metadata for Agenda #${agendaData.id}: ${agendaData.title}`,
      content: Buffer.from(fileContent).toString("base64"),
      branch,
    })

    // Create a pull request
    const { data: pullRequest } = await octokit.pulls.create({
      owner,
      repo,
      title: `Add Agenda #${agendaData.id} Metadata: ${agendaData.title}`,
      head: branch,
      base: "main",
      body: `## Agenda #${agendaData.id} Metadata

**Title:** ${agendaData.title}

**Description:** ${agendaData.description}

**Announcement URL:** ${agendaData.announcementUrl}

${agendaData.snapshotUrl ? `**Snapshot URL:** ${agendaData.snapshotUrl}\n\n` : ''}
**Notice Period:** ${agendaData.noticePeriodSeconds} seconds

**Voting Period:** ${agendaData.votingPeriodSeconds} seconds

**Transactions:**
${agendaData.transactions.map((tx, i) => 
  `${i + 1}. **Target:** \`${tx.targetAddress}\`\n   **Function:** \`${tx.functionSignature}\`\n   **Parameters:** \`${tx.parameters}\`${tx.value ? `\n   **Value:** ${tx.value}` : ''}`
).join('\n\n')}

**Created by:** ${agendaData.creator}

**Created at:** ${agendaData.createdAt}

---

This PR adds metadata for the agenda created on-chain. Please review the agenda details and merge if everything looks correct.`,
    })

    return {
      success: true,
      pullRequestUrl: pullRequest.html_url,
      pullRequestNumber: pullRequest.number
    }
    
  } catch (error) {
    console.error('Failed to create PR:', error)
    return {
      success: false,
      error: error.message
    }
  }
}