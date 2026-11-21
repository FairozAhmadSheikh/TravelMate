const $ = (id) => document.getElementById(id);
const THREAD_KEY = "travel_thread_id";
const STATUS_LINES = ["Searching flights…", "Comparing hotels…", "Mapping out each day…", "Writing your plan…"];

let currentThreadId = localStorage.getItem(THREAD_KEY) || null;
let latestAnswerMarkdown = "";
let statusTimer = null;

function showView(id) {
    ["emptyState", "loadingState", "resultSection"].forEach((v) => {
        $(v).classList.toggle("hidden", v !== id);
    });
}

function resizeInput() {
    const input = $("userInput");
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 260) + "px";
}

function setPrompt(text) {
    const input = $("userInput");
    input.value = text;
    resizeInput();
    input.focus();
}

function setLoading(isLoading) {
    $("sendBtn").disabled = isLoading;
    $("btnText").classList.toggle("hidden", isLoading);
    $("btnLoader").classList.toggle("hidden", !isLoading);

    clearInterval(statusTimer);

    if (isLoading) {
        let i = 0;
        $("statusText").textContent = STATUS_LINES[0];
        showView("loadingState");
        statusTimer = setInterval(() => {
            i = Math.min(i + 1, STATUS_LINES.length - 1);
            $("statusText").textContent = STATUS_LINES[i];
        }, 3500);
    }
}

function showError(message) {
    const box = $("errorBox");
    box.textContent = message;
    box.classList.remove("hidden");
}

function hideError() {
    const box = $("errorBox");
    box.classList.add("hidden");
    box.textContent = "";
}

function showResult(answer, threadId) {
    latestAnswerMarkdown = answer;

    let html = null;
    if (typeof marked !== "undefined") {
        html = marked.parse(answer);
        if (typeof DOMPurify !== "undefined") {
            html = DOMPurify.sanitize(html);
        }
    }

    if (html !== null) {
        $("resultBox").innerHTML = html;
    } else {
        $("resultBox").innerText = answer;
    }

    $("threadInfo").textContent = `Thread ID: ${threadId}`;
    showView("resultSection");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    $("resultSection").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

async function sendMessage() {
    hideError();

    const message = $("userInput").value.trim();

    if (!message) {
        showError("Enter where you want to go, and we'll plan it.");
        return;
    }

    setLoading(true);

    try {
        const response = await fetch("/api/travel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message, thread_id: currentThreadId })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Something went wrong. Try again.");
        }

        currentThreadId = data.thread_id;
        localStorage.setItem(THREAD_KEY, currentThreadId);

        setLoading(false);
        showResult(data.answer, data.thread_id);
    } catch (error) {
        setLoading(false);
        showView(latestAnswerMarkdown ? "resultSection" : "emptyState");
        showError(error.message);
    }
}

function copyResult() {
    const text = $("resultBox").innerText;
    if (!text) return;

    const btn = $("copyBtn");

    navigator.clipboard.writeText(text)
        .then(() => {
            btn.textContent = "Copied";
            setTimeout(() => { btn.textContent = "Copy"; }, 1400);
        })
        .catch(() => showError("Could not copy the plan. Select the text and copy it manually."));
}

function downloadPDF() {
    const pdfContent = $("pdfContent");

    if (!latestAnswerMarkdown || !pdfContent) {
        showError("There's no plan to download yet.");
        return;
    }

    const btn = $("downloadBtn");
    btn.textContent = "Preparing PDF…";
    btn.disabled = true;

    const reset = () => {
        btn.textContent = "Download PDF";
        btn.disabled = false;
    };

    html2pdf()
        .set({
            margin: 0.5,
            filename: "ai-travel-plan.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
            pagebreak: { mode: ["avoid-all", "css", "legacy"] }
        })
        .from(pdfContent)
        .save()
        .then(reset)
        .catch(() => {
            reset();
            showError("Could not create the PDF. Try again.");
        });
}

function newTrip() {
    currentThreadId = null;
    latestAnswerMarkdown = "";
    localStorage.removeItem(THREAD_KEY);
    $("userInput").value = "";
    resizeInput();
    hideError();
    showView("emptyState");
    window.scrollTo({ top: 0 });
    $("userInput").focus();
}

$("planForm").addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
});

$("userInput").addEventListener("input", resizeInput);

$("userInput").addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

document.querySelector(".chips").addEventListener("click", (e) => {
    const chip = e.target.closest("button[data-prompt]");
    if (chip) setPrompt(chip.dataset.prompt);
});

$("copyBtn").addEventListener("click", copyResult);
$("downloadBtn").addEventListener("click", downloadPDF);
$("newBtn").addEventListener("click", newTrip);
