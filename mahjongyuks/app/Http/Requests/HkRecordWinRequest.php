<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HkRecordWinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sesi_id' => ['required', 'integer', 'exists:sesi_bermains,id'],
            'game_table_id' => ['required', 'integer', 'exists:game_tables,id'],
            'winner_id' => ['required', 'integer', 'exists:players,id'],
            'win_method' => ['required', 'in:self_draw,discard'],
            'discarder_id' => ['nullable', 'integer', 'exists:players,id'],
            'hand_codes' => ['required', 'array', 'min:1'],
            'hand_codes.*' => ['required', 'string'],
            'idempotency_key' => ['required', 'string', 'max:64'],
        ];
    }

    public function messages(): array
    {
        return [
            'sesi_id.required' => 'Sesi permainan wajib ditentukan.',
            'sesi_id.exists' => 'Sesi permainan tidak ditemukan.',
            'game_table_id.required' => 'Meja pertandingan wajib ditentukan.',
            'winner_id.required' => 'Pemenang ronde wajib dipilih.',
            'win_method.required' => 'Metode kemenangan (Tarik Sendiri / Buang Lawan) wajib dipilih.',
            'hand_codes.required' => 'Pola kombinasi tangan kemenangan wajib dipilih minimal 1 corak/pola.',
            'idempotency_key.required' => 'Kunci idempotensi transaksi diperlukan.',
        ];
    }
}

