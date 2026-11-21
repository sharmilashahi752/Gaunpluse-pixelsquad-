<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate(['email'=>['required','email'],'password'=>['required','string']]);
        $user = \App\Models\User::where('email',$credentials['email'])->first();
        if (!$user || !Hash::check($credentials['password'],$user->password)) throw ValidationException::withMessages(['email'=>['The provided credentials are incorrect.']]);
        abort_unless($user->isAdmin(), 403, 'This login is reserved for municipal administrators.');
        return response()->json(['token'=>$user->createToken('gaunpulse-admin')->plainTextToken,'user'=>$user]);
    }
    public function logout(Request $request) { $request->user()->currentAccessToken()?->delete(); return response()->noContent(); }
    public function user(Request $request) { return $request->user(); }
}
