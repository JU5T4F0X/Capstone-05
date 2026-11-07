<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['nullable', 'string'],
            'identifier' => ['nullable', 'string'],
            'no_telepon' => ['nullable', 'string'],
            'password' => ['required', 'string'],
            'role' => ['nullable', 'string', 'in:admin,player'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.required' => 'Kata sandi akun wajib diisi.',
            'role.in' => 'Peran akun tidak valid.',
        ];
    }
}

