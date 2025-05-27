import React, { useState, useEffect } from "react";
import { tryOnWithLeffa } from "./api"; // Leffa API 호출
import { shareKakao } from "./share"; // 카카오톡 공유

const Popup = () => {
  const [userImage, setUserImage] = useState(null);
  const [userImageFile, setUserImageFile] = useState(null);
  const [product, setProduct] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 확장 프로그램이 실행될 때 저장된 상품 데이터를 가져옴
  useEffect(() => {
    chrome.storage.local.get(["selectedProduct"], (data) => {
      if (data.selectedProduct) {
        console.log("저장된 상품 데이터 로드:", data.selectedProduct);
        setProduct(data.selectedProduct);
      }
    });

    // 상품 데이터 변경 감지
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "local" && changes.selectedProduct) {
        console.log("상품 데이터 변경 감지:", changes.selectedProduct.newValue);
        setProduct(changes.selectedProduct.newValue);
        setIsSelecting(false); // 상품 선택 완료 시 모드 비활성화
      }
    });
  }, []);

  // 사용자 본인 사진 업로드
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 파일 사이즈 체크 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        alert("이미지 크기가 너무 큽니다. 10MB 이하의 이미지를 선택해주세요.");
        return;
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 선택 가능합니다.");
        return;
      }

      setUserImageFile(file);

      // Blob URL 생성
      const objectUrl = URL.createObjectURL(file);
      setUserImage(objectUrl);
      console.log("사용자 이미지 설정 (Blob URL):", objectUrl);

      // 파일 정보 로깅
      console.log("사용자 이미지 파일 정보:", {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
      });
    }
  };

  // 가상 착용 실행
  const handleTryOn = async () => {
    if (!userImage || !product) {
      alert("본인 사진과 상품을 선택해주세요!");
      return;
    }

    setError(null);
    setIsLoading(true);
    setResultImage(null); // 이전 결과 초기화

    try {
      console.log("가상 착용 시작:", {
        userImage: userImage ? "이미지 있음" : "없음",
        productImage: product.image,
        category: product.category,
      });

      // 의류 이미지 URL 로깅
      console.log("의류 이미지 URL:", product.image);

      // API 호출
      const result = await tryOnWithLeffa(
        userImage, // Blob URL
        product.image,
        product.category
      );

      if (result) {
        console.log("가상 착용 결과 이미지 받음:", result);
        setResultImage(result);

        // 이미지 사전 로드 (옵션)
        const img = new Image();
        img.onload = () => console.log("결과 이미지 로드 성공");
        img.onerror = (e) => console.error("결과 이미지 로드 실패:", e);
        img.src = result;
      } else {
        throw new Error("결과 이미지를 받지 못했습니다.");
      }
    } catch (error) {
      console.error("가상 착용 실패:", error);
      setError(error.message || "가상 착용 중 오류가 발생했습니다.");
      alert(
        `가상 착용 중 오류가 발생했습니다: ${
          error.message || "알 수 없는 오류"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 상품 선택 모드 토글
  const toggleSelectMode = () => {
    const newState = !isSelecting;
    setIsSelecting(newState);

    console.log("상품 선택 모드 토글:", newState);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleSelect" });
      }
    });
  };

  // 이미지 URL 유효성 체크 (디버깅용)
  const checkImageUrl = (url) => {
    if (!url) return false;

    const img = new Image();
    img.onload = () => console.log("이미지 로드 성공:", url);
    img.onerror = () => console.error("이미지 로드 실패:", url);
    img.src = url;
  };

  return (
    <div className="w-80 p-4 bg-white shadow-lg rounded-lg flex flex-col items-center">
      <h2 className="text-lg font-bold mb-4">가상 착용</h2>

      {/* 상품 선택 모드 버튼 */}
      <button
        onClick={toggleSelectMode}
        className={`w-full px-4 py-2 mb-4 rounded-md transition ${
          isSelecting ? "bg-red-500 text-white" : "bg-blue-500 text-white"
        }`}
      >
        {isSelecting ? "상품 선택 모드 종료" : "상품 선택 모드 시작"}
      </button>

      {/* 선택된 상품 정보 */}
      {product ? (
        <div className="mb-4 p-2 border rounded-md w-full flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-2">선택된 상품</h3>
          <img
            src={product.image}
            alt={product.name}
            className="w-32 h-32 object-cover rounded-md shadow-md mb-2"
            onLoad={() => console.log("상품 이미지 로드 성공")}
            onError={(e) => {
              console.error("상품 이미지 로드 실패");
              e.target.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' text-anchor='middle' alignment-baseline='middle' fill='%23999'%3E이미지 없음%3C/text%3E%3C/svg%3E";
            }}
          />
          <p className="text-sm font-medium">{product.name}</p>
          <p className="text-sm">{product.price}</p>
          <p className="text-xs bg-gray-100 px-2 py-1 rounded mt-1">
            카테고리: {product.category}
          </p>
        </div>
      ) : (
        <div className="mb-4 p-4 border border-dashed rounded-md w-full text-center text-gray-500">
          상품을 선택해주세요
        </div>
      )}

      {/* 사용자 이미지 선택 버튼 */}
      <div className="w-full mb-4">
        <label className="block text-sm font-medium mb-2">내 사진 선택</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="border rounded-md p-2 w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          10MB 이하의 이미지 파일을 선택해주세요.
        </p>
      </div>

      {/* 선택된 사용자 이미지 미리보기 */}
      {userImage ? (
        <div className="mb-4 p-2 border rounded-md w-full flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-2">내 사진</h3>
          <img
            src={userImage}
            alt="User"
            className="w-32 h-32 object-cover rounded-md shadow-md"
            onLoad={() => console.log("사용자 이미지 로드 성공")}
            onError={() => console.error("사용자 이미지 로드 실패")}
          />
        </div>
      ) : (
        <div className="mb-4 p-4 border border-dashed rounded-md w-full text-center text-gray-500">
          사진을 선택해주세요
        </div>
      )}

      {/* 가상 착용 실행 버튼 */}
      <button
        onClick={handleTryOn}
        disabled={isLoading || !userImage || !product}
        className={`w-full px-4 py-2 rounded-md mb-4 transition ${
          isLoading || !userImage || !product
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-green-500 text-white hover:bg-green-600"
        }`}
      >
        {isLoading ? "처리 중..." : "가상 착용 실행"}
      </button>

      {/* 로딩 표시 */}
      {isLoading && (
        <div className="flex flex-col justify-center items-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-2"></div>
          <p className="text-sm text-gray-600">
            이미지 처리 중... (최대 1분 소요)
          </p>
        </div>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div className="w-full p-3 mb-4 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* 결과 이미지 */}
      {resultImage && (
        <div className="mt-4 p-3 border rounded-md w-full flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-2">가상 착용 결과</h3>

          {/* 디버깅용 정보 */}
          <div className="text-xs text-gray-500 mb-2 w-full overflow-hidden">
            <div className="truncate">
              이미지 URL: {resultImage.substring(0, 50)}...
            </div>
          </div>

          <img
            src={resultImage}
            alt="Virtual Try-On Result"
            className="w-full max-h-64 object-contain rounded-md shadow-md mb-3"
            onLoad={() => console.log("결과 이미지 로드 성공")}
            onError={(e) => {
              console.error("결과 이미지 로드 실패");
              e.target.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' text-anchor='middle' alignment-baseline='middle' fill='%23999'%3E이미지 로드 실패%3C/text%3E%3C/svg%3E";
              setError(`이미지 URL: ${resultImage}`);
            }}
          />

          <div className="flex gap-3 w-full">
            {/* <button
              onClick={() => shareKakao(resultImage)}
              className="flex-1 bg-yellow-400 text-black px-3 py-2 rounded-md text-sm"
            >
              카카오톡 공유
            </button> */}
            <a
              href={resultImage}
              download="try-on-result.jpg"
              className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-md text-center text-sm"
              target="_blank"
            >
              다운로드
            </a>
          </div>
        </div>
      )}

      <div className="w-full mt-4 text-xs text-gray-500 text-center border-t pt-2">
        © 2024 OTFIT - 온라인 피팅 솔루션
      </div>
    </div>
  );
};

export default Popup;
