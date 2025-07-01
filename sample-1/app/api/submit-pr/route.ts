import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// CORS 헤더 설정
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS 요청 처리
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { agendaData, message } = await request.json();

    // 1. 원본 저장소 포크 확인/생성
    const forkOwner = process.env.GITHUB_FORK_OWNER!; // 포크한 저장소 소유자
    const forkRepo = process.env.GITHUB_REPO!; // 저장소 이름
    const baseOwner = process.env.GITHUB_OWNER!; // 원본 저장소 소유자
    const baseRepo = process.env.GITHUB_REPO!; // 원본 저장소 이름

    console.log("[SubmitPR] Checking fork status...", {
      forkOwner,
      forkRepo,
      baseOwner,
      baseRepo,
    });

    // 포크 존재 여부 확인 및 생성
    let forkExists = false;
    try {
      const { data: forkData } = await octokit.repos.get({
        owner: forkOwner,
        repo: forkRepo,
      });
      console.log("[SubmitPR] Fork repository data:", {
        isFork: forkData.fork,
        sourceRepo: forkData.source?.full_name,
        expectedSource: `${baseOwner}/${baseRepo}`,
        defaultBranch: forkData.default_branch,
      });
      // 포크가 존재하고 정상적인 상태인지 확인
      forkExists =
        forkData.fork &&
        forkData.source?.full_name === `${baseOwner}/${baseRepo}`;
      console.log("[SubmitPR] Fork exists:", forkExists);
    } catch (error) {
      console.log("[SubmitPR] Error checking fork:", error);
      forkExists = false;
    }

    if (!forkExists) {
      console.log("[SubmitPR] Creating new fork...");
      // 포크가 없으면 생성
      await octokit.repos.createFork({
        owner: baseOwner,
        repo: baseRepo,
      });
      console.log("[SubmitPR] Fork creation initiated");
    }

    // 포크가 준비될 때까지 최대 30초 대기
    let retries = 0;
    const maxRetries = 6; // 30초 = 5초 * 6회

    console.log("[SubmitPR] Waiting for fork to be ready...");
    while (retries < maxRetries) {
      try {
        const { data: forkData } = await octokit.repos.get({
          owner: forkOwner,
          repo: forkRepo,
        });
        console.log("[SubmitPR] Fork status check attempt", retries + 1, {
          isFork: forkData.fork,
          sourceRepo: forkData.source?.full_name,
          expectedSource: `${baseOwner}/${baseRepo}`,
          defaultBranch: forkData.default_branch,
        });

        // 저장소가 준비되고 정상적인 포크인지 확인
        if (
          forkData.fork &&
          forkData.source?.full_name === `${baseOwner}/${baseRepo}`
        ) {
          // 추가로 기본 브랜치가 실제로 존재하는지 확인
          try {
            await octokit.git.getRef({
              owner: forkOwner,
              repo: forkRepo,
              ref: `heads/${forkData.default_branch}`,
            });
            console.log(
              "[SubmitPR] Fork is ready with accessible default branch!"
            );
            break;
          } catch (refError) {
            console.log(
              "[SubmitPR] Default branch not yet accessible, retrying..."
            );
            retries++;
            if (retries === maxRetries) {
              throw new Error("Fork repository default branch not accessible");
            }
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }
        }
      } catch (error) {
        console.log("[SubmitPR] Error checking fork status:", error);
      }

      retries++;
      if (retries === maxRetries) {
        throw new Error("Fork repository creation timeout");
      }
      // 5초 대기 후 재시도
      console.log("[SubmitPR] Waiting 5 seconds before next attempt...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // 2. 유니크한 브랜치 이름 생성
    const baseBranch = "main";
    let branchName = "";
    let branchExists = true;
    let attempts = 0;
    const maxAttempts = 5;

    // 브랜치 이름이 유니크할 때까지 시도
    while (branchExists && attempts < maxAttempts) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      branchName = `agenda-${agendaData.id}-${timestamp}-${random}`;

      // 브랜치 존재 여부 확인
      try {
        await octokit.git.getRef({
          owner: forkOwner,
          repo: forkRepo,
          ref: `heads/${branchName}`,
        });
        console.log(`[SubmitPR] Branch ${branchName} already exists, trying new name...`);
        branchExists = true;
        attempts++;
        // 1초 대기 후 재시도 (timestamp 변경을 위해)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // 404 에러면 브랜치가 존재하지 않음 (정상)
        console.log(`[SubmitPR] Branch ${branchName} is available`);
        branchExists = false;
      }
    }

    if (branchExists) {
      throw new Error(`Failed to generate unique branch name after ${maxAttempts} attempts`);
    }

    // 포크를 최신 상태로 동기화 (git fetch upstream + merge)
    console.log("[SubmitPR] Fetching latest from upstream...");

    // 1. 원본 저장소에서 최신 SHA 가져오기 (git fetch upstream)
    const { data: upstreamRef } = await octokit.git.getRef({
      owner: baseOwner,
      repo: baseRepo,
      ref: `heads/${baseBranch}`,
    });
    console.log("[SubmitPR] Upstream latest SHA:", upstreamRef.object.sha);

    // 2. 포크의 main 브랜치를 원본 SHA로 업데이트 (git merge upstream/main)
    let forkUpdateSuccess = false;
    try {
      await octokit.git.updateRef({
        owner: forkOwner,
        repo: forkRepo,
        ref: `heads/${baseBranch}`,
        sha: upstreamRef.object.sha,
        force: true,
      });
      console.log("[SubmitPR] Fork successfully synced to latest upstream");
      forkUpdateSuccess = true;

      // 포크 업데이트 후 잠시 대기 (GitHub API 동기화 시간)
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (updateError) {
      console.log("[SubmitPR] Fork update failed:", updateError instanceof Error ? updateError.message : String(updateError));
      forkUpdateSuccess = false;
    }

    // 3. 업데이트 확인: 포크에서 실제로 SHA 존재하는지 검증
    let refData;
    if (forkUpdateSuccess) {
      try {
        const { data: forkRef } = await octokit.git.getRef({
          owner: forkOwner,
          repo: forkRepo,
          ref: `heads/${baseBranch}`,
        });

        if (forkRef.object.sha === upstreamRef.object.sha) {
          console.log("[SubmitPR] Fork verification success - using fork SHA");
          refData = forkRef;
        } else {
          console.log("[SubmitPR] Fork SHA mismatch - using upstream SHA as fallback");
          refData = upstreamRef;
        }
      } catch (verifyError) {
        console.log("[SubmitPR] Fork verification failed - using upstream SHA as fallback");
        refData = upstreamRef;
      }
    } else {
      console.log("[SubmitPR] Using upstream SHA (fork update failed)");
      refData = upstreamRef;
    }

    console.log("[SubmitPR] Final SHA for branch creation:", refData.object.sha);

    // 포크한 저장소에 새 브랜치 생성
    console.log(
      "[SubmitPR] Creating branch:",
      branchName,
      "with SHA:",
      refData.object.sha
    );
    await octokit.git.createRef({
      owner: forkOwner,
      repo: forkRepo,
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha,
    });

    // 3. 파일 생성
    const filePath = `data/agendas/${agendaData.network}/agenda-${agendaData.id}.json`;

    // 먼저 파일이 존재하는지 확인
    const { data: existingFile } = await octokit.repos
      .getContent({
        owner: forkOwner,
        repo: forkRepo,
        path: filePath,
        ref: branchName,
      })
      .catch(() => ({ data: null }));

    try {
      // 파일 생성 또는 업데이트
      const isUpdate = existingFile && !Array.isArray(existingFile);
      const commitMessage = isUpdate
        ? `update: agenda ${agendaData.network}-${agendaData.id}`
        : `add: agenda ${agendaData.network}-${agendaData.id}`;

      await octokit.repos.createOrUpdateFileContents({
        owner: forkOwner,
        repo: forkRepo,
        path: filePath,
        message: commitMessage,
        content: Buffer.from(JSON.stringify(agendaData, null, 2)).toString(
          "base64"
        ),
        branch: branchName,
        ...(existingFile && !Array.isArray(existingFile)
          ? { sha: existingFile.sha }
          : {}),
      });
    } catch (error) {
      console.error("Error creating/updating file:", error);
      throw error;
    }

    // 4. PR 생성
    // 파일이 이미 존재하는 경우 업데이트로 처리
    const isUpdate = existingFile && !Array.isArray(existingFile);
    const prPrefix = isUpdate ? "[Agenda Update]" : "[Agenda]";
    const prTitle = `${prPrefix} ${agendaData.network} - ${agendaData.id} - ${agendaData.title}`;
    const truncatedTitle =
      prTitle.length > 100 ? prTitle.substring(0, 97) + "..." : prTitle;

    const { data: pr } = await octokit.pulls.create({
      owner: baseOwner,
      repo: baseRepo,
      title: truncatedTitle,
      body: `## Agenda Metadata ${isUpdate ? "Update" : "Submission"}
- Network: ${agendaData.network}
- Agenda ID: ${agendaData.id}
- Title: ${agendaData.title}
- Transaction Hash: ${agendaData.transaction}
- Creator Address: ${agendaData.creator.address}
- Signature: ${agendaData.creator.signature}

## Description
${message}

## Type of change
- [x] ${isUpdate ? "Updated agenda" : "New agenda"}

## Checklist
- [x] My PR title follows the format: \`${prPrefix} <network> - <agenda_id> - <agenda_title>\`
- [x] I have ${isUpdate ? "updated" : "added"} only one agenda file
- [x] I have verified the agenda metadata
- [x] I have checked the agenda ID matches the PR title
- [x] I have verified the network (mainnet/sepolia) matches the PR title`,
      head: `${forkOwner}:${branchName}`,
      base: baseBranch,
    });

    return NextResponse.json({ prUrl: pr.html_url }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error submitting PR:", error);
    let errorMessage = "Failed to submit PR";

    if (error instanceof Error) {
      if (error.message.includes("Fork repository creation timeout")) {
        errorMessage =
          "Failed to create fork repository. Please try again later.";
      } else if (error.message.includes("Not Found")) {
        errorMessage =
          "Repository not found. Please check the repository configuration.";
      } else if (error.message.includes("Bad credentials")) {
        errorMessage =
          "Invalid GitHub token. Please check the token configuration.";
      } else if (error.message.includes("rate limit")) {
        errorMessage =
          "GitHub API rate limit exceeded. Please try again later.";
      } else {
        errorMessage = `Failed to submit PR: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}
