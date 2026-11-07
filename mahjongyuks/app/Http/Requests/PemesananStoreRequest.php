<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PemesananStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'meja_id' => ['required', 'integer', 'exists:mejas,id'],
            'tanggal_main' => ['required', 'date', 'after_or_equal:today'],
            'waktu_mulai' => ['required', 'date_format:H:i'],
            'durasi_jam' => ['required', 'integer', 'min:1', 'max:12'],
            'jenis_pemesanan' => ['required', 'in:Casual,Competitive'],
            'kursi_pilihan' => ['required', 'in:ton,nan,sha,pei'],
            'total_biaya' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'meja_id.required' => 'Silakan pilih meja permainan.',
            'meja_id.exists' => 'Meja permainan yang dipilih tidak ditemukan.',
            'tanggal_main.required' => 'Tanggal bermain wajib ditentukan.',
            'tanggal_main.after_or_equal' => 'Tanggal bermain tidak boleh di masa lampau.',
            'waktu_mulai.required' => 'Jam mulai bermain wajib ditentukan.',
            'durasi_jam.required' => 'Durasi bermain wajib ditentukan.',
            'jenis_pemesanan.required' => 'Format permainan (Casual/Competitive) wajib dipilih.',
            'kursi_pilihan.required' => 'Posisi kursi mata angin wajib dipilih (ton, nan, sha, atau pei).',
            'kursi_pilihan.in' => 'Posisi kursi tidak valid (pilih ton, nan, sha, atau pei).',
        ];
    }
}

