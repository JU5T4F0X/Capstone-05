<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class VenueRequest extends FormRequest
{
    /**
     * Tentukan apakah pengguna memiliki otorisasi untuk melakukan request ini.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi untuk data Venue.
     */
    public function rules(): array
    {
        $rules = [
            'nama_venue' => ['required', 'string', 'max:255'],
            'alamat' => ['required', 'string', 'max:500'],
            'kota_kecamatan' => ['nullable', 'string', 'max:255'],
            'telepon' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'jam_buka' => ['nullable', 'string', 'max:20'],
            'jam_tutup' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'maps_url' => ['nullable', 'string', 'max:1000'],
            'deskripsi' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:active,inactive,maintenance'],
            'jumlah_meja' => ['nullable', 'integer', 'min:0'],
            'foto' => ['nullable'],
            'fasilitas' => ['nullable', 'string'],
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
            'nama_venue.required' => 'Nama venue wajib diisi.',
            'alamat.required' => 'Alamat lengkap venue wajib diisi.',
            'status.required' => 'Status operasional venue wajib dipilih.',
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
            'message' => 'Validasi formulir venue gagal. Silakan periksa kembali data yang dimasukkan.',
            'errors' => $validator->errors(),
        ], 422));
    }
}

