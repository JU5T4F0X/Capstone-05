<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Player;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Registrasi Akun Pemain Baru
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:6'],
            'no_telepon' => ['nullable', 'string', 'max:20'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'nama' => $request->nama,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'no_telepon' => $request->no_telepon,
            'role' => 'player',
        ]);

        // Create player profile
        Player::create([
            'user_id' => $user->id,
            'tanggal_daftar' => now(),
            'status' => 'active',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi akun berhasil',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'no_telepon' => $user->no_telepon,
                    'role' => $user->role,
                ],
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Login User (Admin / Pemain)
     */
    public function login(Request $request): JsonResponse
    {
        $input = $request->input('email') ?? $request->input('identifier') ?? $request->input('no_telepon');
        $password = $request->input('password');

        if (empty($input) || empty($password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email/ID dan kata sandi wajib diisi.',
            ], 422);
        }

        $cleanPhone = preg_replace('/[^0-9]/', '', (string)$input);

        // Find user by email, phone, or prefix match for operator ID
        $user = User::where(function ($query) use ($input, $cleanPhone) {
            $query->where('email', $input)
                ->orWhere('email', strtolower($input) . '@mahjongyuks.id');

            if (!empty($cleanPhone) && strlen($cleanPhone) >= 8) {
                $query->orWhere('no_telepon', 'like', '%' . substr($cleanPhone, -8));
            }
        })->first();

        // Also allow OP-049 to match
        if (! $user && strtoupper($input) === 'OP-049') {
            $user = User::where('email', 'op-049@mahjongyuks.id')
                ->orWhere('email', 'adm-jkt-042@mahjongyuks.id')
                ->first();
        }

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kombinasi ID / Email dan kata sandi tidak valid. Silakan periksa kembali.',
            ], 401);
        }

        // Check role restriction if requested
        if ($request->has('role') && $request->role === 'admin' && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Akun ini bukan akun staf/administrator.',
            ], 403);
        }

        // Token creation
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'no_telepon' => $user->no_telepon,
                    'role' => $user->role,
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Profil User yang Sedang Login
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil dimuat',
            'data' => [
                'id' => $user->id,
                'nama' => $user->nama,
                'email' => $user->email,
                'no_telepon' => $user->no_telepon,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Logout & Revoke Token
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil',
        ]);
    }
}
