// import React, { useState, useEffect } from "react"
// import { tryOnWithLeffa } from "../api" // Leffa API 호출
// import { shareKakao } from "../share" // 카카오톡 공유

// const Popup = () => {
//   const [userImage, setUserImage] = useState(null)
//   const [product, setProduct] = useState(null)
//   const [resultImage, setResultImage] = useState(null)

//   // 사용자 본인 사진 업로드
//   const handleFileChange = (event) => {
//     const file = event.target.files[0]
//     if (file) {
//       setUserImage(URL.createObjectURL(file)) // UI 미리보기
//     }
//   }

//   // 가상 착용 실행
//   const handleTryOn = async () => {
//     if (!userImage || !product) {
//       alert("본인 사진과 상품을 선택해주세요!")
//       return
//     }

//     const result = await tryOnWithLeffa(userImage, product.image, product.category)
//     setResultImage(result)
//   }

//   return (
//     <div className="w-80 p-4 bg-white shadow-lg rounded-lg flex flex-col items-center">
//       <h2 className="text-lg font-bold mb-4">가상 착용</h2>

//       {product && (
//         <div className="mb-4 flex flex-col items-center">
//           <img src={product.image} alt={product.name} className="w-32 h-32 object-cover rounded-md shadow-md" />
//           <p className="text-sm font-medium mt-2">
//             {product.name} - {product.price}
//           </p>
//         </div>
//       )}

//       <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4 border rounded-md p-2 w-full" />
//       {userImage && <img src={userImage} alt="Uploaded User" className="w-32 h-32 object-cover rounded-md shadow-md" />}

//       <button onClick={handleTryOn} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
//         가상 착용 실행
//       </button>

//       {resultImage && (
//         <div className="mt-4 flex flex-col items-center">
//           <img src={resultImage} alt="Virtual Try-On Result" className="w-48 h-auto object-cover rounded-md shadow-md" />
//           <div className="mt-3 flex gap-3">
//             <button onClick={() => shareKakao(resultImage)} className="bg-yellow-400 text-black px-4 py-2 rounded-md">
//               카카오톡 공유
//             </button>
//             <a href={resultImage} download="try-on-result.jpg" className="bg-green-500 text-white px-4 py-2 rounded-md">
//               다운로드
//             </a>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default Popup
