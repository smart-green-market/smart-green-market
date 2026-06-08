import { useState } from "react";

import { useAuth } from "../../contexts/authProvider";

export default function AdminLoginPage() {
    const { login } =
        useAuth();

    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleSubmit =
        async (e) => {
            e.preventDefault();

            setLoading(true);
            setError("");

            const result =
                await login(
                    username,
                    password
                );

            if (!result.success) {
                setError(
                    result.message
                );
            }

            setLoading(false);
        };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">

            <form
                onSubmit={
                    handleSubmit
                }
                className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 p-8"
            >
                <h1 className="text-3xl font-bold text-center mb-8">
                    Admin Login
                </h1>

                <div className="flex flex-col gap-5">

                    <div>
                        <label className="text-sm font-medium">
                            Username
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(
                                e
                            ) =>
                                setUsername(
                                    e
                                        .target
                                        .value
                                )
                            }
                            className="mt-2 w-full h-12 px-4 rounded-xl border border-neutral-300 outline-none focus:border-green-600"
                            placeholder="Nhập username"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(
                                e
                            ) =>
                                setPassword(
                                    e
                                        .target
                                        .value
                                )
                            }
                            className="mt-2 w-full h-12 px-4 rounded-xl border border-neutral-300 outline-none focus:border-green-600"
                            placeholder="Nhập mật khẩu"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={
                            loading
                        }
                        className="h-12 rounded-xl bg-green-700 hover:bg-green-600 text-white font-semibold transition-colors"
                    >
                        {loading
                            ? "Đang đăng nhập..."
                            : "Đăng nhập"}
                    </button>
                </div>
            </form>
        </div>
    );
}
