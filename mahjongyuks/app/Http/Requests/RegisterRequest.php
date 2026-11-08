<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'no_telepon' => ['nullable', 'string', 'max:20'],
            'tingkat_kemahiran' => ['nullable', 'string', 'in:beginner,intermediate,advance,Beginner,Intermediate,Advance'],
            'kemahiran' => ['nullable', 'string', 'in:beginner,intermediate,advance,Beginner,Intermediate,Advance'],
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
            'email.unique' => 'Alamat email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
            'tingkat_kemahiran.in' => 'Tingkat kemahiran hanya boleh: beginner, intermediate, atau advance.',
            'kemahiran.in' => 'Tingkat kemahiran hanya boleh: beginner, intermediate, atau advance.',
        ];
    }
}

