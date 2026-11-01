<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class EventRequest extends FormRequest
{
    /**
     * Tentukan apakah pengguna memiliki otorisasi untuk melakukan request ini.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi untuk data Event.
     */
    public function rules(): array
    {
        $rules = [
            'nama_event' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'tanggal_event' => ['required', 'date'],
            'waktu_mulai' => ['required', 'string'],
            'waktu_selesai' => ['required', 'string'],
            'status' => ['required', 'string', 'in:active,cancelled,selesai,upcoming,draft'],
            'jenis_event' => ['nullable', 'string', 'in:Event,Non-Event,event,non-event'],
            'venue_id' => ['nullable', 'exists:venues,id'],
            'biaya' => ['nullable', 'string', 'max:100'],
            'kuota' => ['nullable', 'string', 'max:100'],
            'foto' => ['nullable'], // string path atau uploaded file
        ];

        // Jika berupa file upload
        if ($this->hasFile('foto')) {
            $rules['foto'] = ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120']; // Maks 5MB
        }

        return $rules;
    }

    /**
     * Pesan kustom untuk kegagalan validasi.
     */
    public function messages(): array
    {
        return [
            'nama_event.required' => 'Nama event wajib diisi.',
            'tanggal_event.required' => 'Tanggal pelaksanaan event wajib diisi.',
            'tanggal_event.date' => 'Format tanggal event tidak valid.',
            'waktu_mulai.required' => 'Waktu mulai event wajib diisi.',
            'waktu_selesai.required' => 'Waktu selesai event wajib diisi.',
            'status.required' => 'Status event wajib dipilih.',
            'venue_id.exists' => 'Venue yang dipilih tidak valid atau tidak terdaftar di sistem.',
            'foto.image' => 'File foto harus berupa gambar valid (JPEG, PNG, JPG, WebP).',
            'foto.max' => 'Ukuran file foto maksimal adalah 5MB.',
        ];
    }

    /**
     * Format response JSON saat validasi gagal.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validasi formulir event gagal. Silakan periksa kembali data yang dimasukkan.',
            'errors' => $validator->errors(),
        ], 422));
    }
}

