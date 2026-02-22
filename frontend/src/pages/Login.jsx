import { useState } from 'react';

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-indigo-600 mb-2">Smart Proctor</h2>
        <p className="text-center text-gray-500 mb-6">Güvenli Sınav Sistemi</p>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-posta</label>
            <input 
              type="email" 
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="ogrenci@univ.edu.tr"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Şifre</label>
            <input 
              type="password" 
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="button" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
          >
            Giriş Yap
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          © 2026 Smart Proctor AI
        </p>
      </div>
    </div>
  );
}

export default Login;
