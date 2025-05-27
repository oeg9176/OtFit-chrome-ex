let isSelecting = false;
let overlay = null;

// ✅ 팝업에서 버튼 클릭 시 상품 선택 모드 토글
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleSelect") {
    isSelecting = !isSelecting;
    console.log(`🟢 상품 선택 모드: ${isSelecting ? "활성화" : "비활성화"}`);
    if (isSelecting) {
      createOverlay();
      addClickListener();
    } else {
      removeOverlay();
      removeClickListener();
    }
  } else if (request.action === "selectionComplete") {
    // 상품 선택 완료 시 상품 선택 모드 종료
    isSelecting = false;
    removeOverlay();
    removeClickListener();
    console.log("🛑 상품 선택 완료로 모드 종료");
  }
});

// 쇼핑몰 페이지에 "가상 착용" 버튼 추가
window.onload = function () {
  const productContainer = document.querySelector(".product-detail");
  if (!productContainer) return;

  const tryOnButton = document.createElement("button");
  tryOnButton.innerText = "👗 가상 착용";
  tryOnButton.style.cssText =
    "position: absolute; top: 10px; right: 10px; background: #ff4081; color: white; padding: 8px; border-radius: 5px; cursor: pointer;";
  productContainer.appendChild(tryOnButton);

  tryOnButton.addEventListener("click", () => {
    const productName =
      document.querySelector(".product-title")?.innerText || "Unknown";
    const productImage =
      document.querySelector(".product-image img")?.src || "";
    const productPrice =
      document.querySelector(".product-price")?.innerText || "Unknown";
    const productCategory = classifyCategory(productName); // 카테고리 자동 판별

    if (productImage) {
      chrome.runtime.sendMessage({
        action: "tryOn",
        product: {
          name: productName,
          image: productImage,
          price: productPrice,
          category: productCategory,
        },
      });
    } else {
      alert("상품 이미지를 찾을 수 없습니다.");
    }
  });
};

// ✅ 상품 선택 시 화면 오버레이 효과 추가
function createOverlay() {
  overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
  overlay.style.zIndex = "10000";
  overlay.style.pointerEvents = "none";
  document.body.appendChild(overlay);
}

// ✅ 상품 선택 종료 시 오버레이 제거
function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}

// ✅ 이벤트 리스너 추가
function addClickListener() {
  console.log("🖱 상품 클릭 이벤트 추가됨!");
  document.addEventListener("click", handleClick, true);
  document.addEventListener("mouseover", handleMouseOver, true);
  document.addEventListener("mouseout", handleMouseOut, true);
}

// ✅ 이벤트 리스너 제거
function removeClickListener() {
  console.log("🛑 상품 클릭 이벤트 제거됨!");
  document.removeEventListener("click", handleClick, true);
  document.removeEventListener("mouseover", handleMouseOver, true);
  document.removeEventListener("mouseout", handleMouseOut, true);
}

// ✅ 마우스 오버 이벤트 처리
function handleMouseOver(e) {
  if (!isSelecting) return;

  const productElement = findProductElement(e.target);
  if (productElement) {
    productElement.style.outline = "2px solid #ff5500";
    e.preventDefault();
    e.stopPropagation();
  }
}

// ✅ 마우스 아웃 이벤트 처리
function handleMouseOut(e) {
  if (!isSelecting) return;

  const productElement = findProductElement(e.target);
  if (productElement) {
    productElement.style.outline = "";
  }
}

// ✅ 상품 요소를 찾는 함수
function findProductElement(element) {
  let current = element;
  let depth = 0;
  const maxDepth = 10;

  while (current && current !== document.body && depth < maxDepth) {
    depth++;

    if (current.classList && current.classList.contains("god-item")) {
      return current;
    }

    if (
      current.querySelector &&
      current.querySelector(".caption") &&
      current.querySelector("img")
    ) {
      return current;
    }

    if (
      current.classList &&
      (current.classList.contains("cunit_t232") ||
        current.classList.contains("cunit_t") ||
        current.classList.contains("item"))
    ) {
      return current;
    }

    const hasImg = current.querySelector && current.querySelector("img");
    const hasPrice =
      current.textContent &&
      (current.textContent.includes("원") ||
        current.textContent.match(/\d{3,6}원/));

    if (hasImg && hasPrice && current.children && current.children.length > 1) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

// ✅ 상품 클릭 시 데이터 추출 후 background.js로 전송
function handleClick(e) {
  if (!isSelecting) return;

  console.log("🖱 상품 클릭 감지됨!", e.target);

  const productElement = findProductElement(e.target);
  if (productElement) {
    const productInfo = extractProductInfo(productElement);
    if (productInfo) {
      // 액션 이름을 tryOn으로 변경
      chrome.runtime.sendMessage({
        action: "tryOn",
        product: productInfo,
      });

      showFeedback(productElement, "✓ 상품이 선택되었습니다");
    }

    e.preventDefault();
    e.stopPropagation();
  }
}

// ✅ 상품 정보 추출 함수
function extractProductInfo(productElement) {
  const img = productElement.querySelector("img");
  const imgSrc = img ? img.src || img.getAttribute("data-src") || "" : "";

  let productName =
    productElement
      .querySelector(".name, .title, .prd_name")
      ?.textContent?.trim() || "Unknown";
  let price =
    productElement
      .querySelector(".price, .prc, .amount")
      ?.textContent?.trim() || "0";

  // 상품 정보 형식 통일
  return {
    name: productName,
    image: imgSrc,
    price: price,
    category: classifyCategory(productName),
  };
}

// ✅ 카테고리 판별 함수
function classifyCategory(productName) {
  const lowerKeywords = ["pants", "jeans", "skirt", "shorts"];
  const dressKeywords = ["dress", "gown"];
  const nameLower = productName.toLowerCase();

  if (dressKeywords.some((keyword) => nameLower.includes(keyword))) {
    return "Dress";
  }
  if (lowerKeywords.some((keyword) => nameLower.includes(keyword))) {
    return "Lower";
  }
  return "Upper";
}

// ✅ 사용자 피드백 표시 함수
function showFeedback(element, message) {
  const feedback = document.createElement("div");
  feedback.textContent = message;
  feedback.style.position = "fixed";
  feedback.style.top = "20px";
  feedback.style.left = "50%";
  feedback.style.transform = "translateX(-50%)";
  feedback.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  feedback.style.color = "white";
  feedback.style.padding = "10px 20px";
  feedback.style.borderRadius = "5px";
  feedback.style.zIndex = "100000";
  document.body.appendChild(feedback);

  element.style.outline = "2px solid green";

  setTimeout(() => {
    feedback.remove();
    element.style.outline = "";
  }, 2000);
}

console.log("✅ 상품 선택 기능 추가 완료!");
