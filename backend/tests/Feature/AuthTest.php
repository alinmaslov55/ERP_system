<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'jane@example.com',
            'password' => Hash::make('secret-password'),
            'is_active' => true,
            'last_login_at' => null,
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'jane@example.com',
            'password' => 'secret-password',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Authenticated')
            ->assertJsonPath('data.email', 'jane@example.com')
            ->assertJsonPath('data.is_active', true);

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_login_fails_with_invalid_password(): void
    {
        User::factory()->create([
            'email' => 'jane@example.com',
            'password' => Hash::make('secret-password'),
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'jane@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        $this->assertGuest();
    }

    public function test_deactivated_user_cannot_login(): void
    {
        User::factory()->deactivated()->create([
            'email' => 'deactivated@example.com',
            'password' => Hash::make('secret-password'),
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'deactivated@example.com',
            'password' => 'secret-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        $this->assertGuest();
    }

    public function test_login_rate_limiting_triggers_after_five_failed_attempts(): void
    {
        User::factory()->create([
            'email' => 'targeted@example.com',
            'password' => Hash::make('correct-password'),
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/login', [
                'email' => 'targeted@example.com',
                'password' => 'wrong-password',
            ])->assertStatus(422);
        }

        $response = $this->postJson('/api/v1/login', [
            'email' => 'targeted@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(429);
    }

    public function test_authenticated_user_can_fetch_me_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'profile@example.com',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/me');

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', 'profile@example.com');
    }

    public function test_unauthenticated_request_to_me_returns_401(): void
    {
        $response = $this->getJson('/api/v1/me');

        $response->assertStatus(401);
    }

    public function test_user_can_logout_and_session_is_invalidated(): void
    {
        $user = User::factory()->create([
            'email' => 'logout-user@example.com',
            'password' => Hash::make('password123'),
        ]);

        $headers = ['referer' => 'http://localhost:5173'];

        $this->postJson('/api/v1/login', [
            'email' => 'logout-user@example.com',
            'password' => 'password123',
        ], $headers)->assertStatus(200);

        $response = $this->postJson('/api/v1/logout', [], $headers);

        $response->assertStatus(204);

        $this->getJson('/api/v1/me', $headers)->assertStatus(401);
    }

    public function test_unauthenticated_access_to_products_returns_401(): void
    {
        $response = $this->getJson('/api/v1/products');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_access_to_categories_and_warehouses_returns_401(): void
    {
        $this->getJson('/api/v1/categories')->assertStatus(401);
        $this->getJson('/api/v1/warehouses')->assertStatus(401);
    }

    public function test_authenticated_user_can_access_products(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/products');

        $response->assertStatus(200);
    }
}