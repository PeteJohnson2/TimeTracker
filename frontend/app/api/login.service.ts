/*
  - Copyright 2022 Sven Loesekann
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
import { useNavigate } from "react-router";
import GlobalState from "~/global-state";
import type { LoginRequest, LoginResponse } from "~/model/login";

export const apiPrefix = "/rest";

let apiUrl = import.meta.env.VITE_API_URL || "";

// Load runtime config if available
export async function initializeApiUrl(): Promise<void> {
  try {
    const response = await fetch("/config.json");
    if (response.ok) {
      const config = await response.json();
      apiUrl = config.apiUrl || apiUrl;
    }
  } catch (error) {
    console.warn("Could not load runtime config:", error);
    // Fall back to build-time environment variable
  }
}

export function getApiUrl(): string {
  return apiUrl;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new ApiError(
      error || `HTTP error! status: ${response.status}`,
      response.status,
    );
  }
  return response.json();
}

export const postLogin = async function (
  email: string,
  password1: string,
  controller: AbortController | null,
): Promise<LoginResponse> {
  const requestOptions = loginSigninOptions(email, "", password1, controller);  
  const result = await fetch(
    `${getApiUrl()}${apiPrefix}/login/login`,
    requestOptions,
  );
  return handleResponse<LoginResponse>(result);
};

export const postSignin = async function (
  email: string,
  username: string,
  password1: string,
  controller: AbortController | null,
): Promise<LoginResponse> {
  const requestOptions = loginSigninOptions(
    email,
    username,
    password1,
    controller,
  );
  const result = await fetch(
    `${getApiUrl()}${apiPrefix}/login/signin`,
    requestOptions,
  );
  return handleResponse<LoginResponse>(result);
};

const loginSigninOptions = (
  email: string,
  username: string,
  password1: string,
  controller: AbortController | null,
) => {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email,
      username: username,
      password: password1,
    } as LoginRequest),
    signal: controller?.signal,
  };
};

interface RefreshToken {
  token: string;
}

export const updateToken = () => {  
  setInterval(async () => {
    const abortController = new AbortController();
    const response = await fetch(`${getApiUrl()}${apiPrefix}/login/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GlobalState.jwtToken}`,
      },
      body: JSON.stringify({ token: GlobalState.jwtToken } as RefreshToken),
      signal: abortController.signal,
    });
    const result = await handleResponse<RefreshToken>(response);
    if(!result?.token) {
      GlobalState.jwtToken = "";
      window.location.href = "/";
      window.location.reload();
      return;
    }
    GlobalState.jwtToken = result.token;
  }, 40 * 1000);
};
