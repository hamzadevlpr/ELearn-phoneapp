import AsyncStorage from "@react-native-async-storage/async-storage";
import APP_CONFIG from "@/constants/config";

export interface Teacher {
  id: string;
  name: string;
  image?: string;
  subject?: string;
  bio?: string;
  coursesCount?: number;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  image?: string;
  price?: number;
  lessonsCount?: number;
  teacherName?: string;
  teacherId?: string;
  isPurchased?: boolean;
  grade?: string;
  subject?: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration?: number;
  videoUrl?: string;
  isLocked?: boolean;
  order?: number;
  description?: string;
}

export interface ExamQuestion {
  id: string;
  text: string;
  options: string[];
  imageUrl?: string;
}

export interface Exam {
  id: string;
  title: string;
  questionsCount?: number;
  durationMinutes?: number;
  isCompleted?: boolean;
  score?: number;
  passingScore?: number;
  courseId?: string;
  questions?: ExamQuestion[];
}

export interface ExamResult {
  score: number;
  total: number;
  passed: boolean;
  correctCount: number;
  wrongCount: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  image?: string;
  grade?: string;
  email?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("auth_token");
}

async function buildHeaders(includeAuth = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "tenantId": APP_CONFIG.TENANT_ID,
  };
  if (includeAuth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  includeAuth = true
): Promise<T> {
  const headers = await buildHeaders(includeAuth);
  const url = `${APP_CONFIG.API_BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message = (data as { message?: string })?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  auth: {
    login: (phone: string, password: string) =>
      request<LoginResponse>("POST", "/Account/Login", { phone, password }, false),
  },
  teachers: {
    list: () => request<Teacher[]>("GET", "/Teacher"),
  },
  courses: {
    list: (teacherId?: string) =>
      request<Course[]>("GET", `/Course${teacherId ? `?teacherId=${teacherId}` : ""}`),
    get: (id: string) => request<Course>("GET", `/Course/${id}`),
    redeem: (courseId: string, code: string) =>
      request<{ success: boolean }>("POST", `/Course/${courseId}/Redeem`, { code }),
    lessons: (courseId: string) => request<Lesson[]>("GET", `/Course/${courseId}/Lessons`),
    exams: (courseId: string) => request<Exam[]>("GET", `/Course/${courseId}/Exams`),
  },
  lessons: {
    get: (id: string) => request<Lesson>("GET", `/Lesson/${id}`),
  },
  exams: {
    get: (id: string) => request<Exam>("GET", `/Exam/${id}`),
    submit: (examId: string, answers: { questionId: string; selectedIndex: number }[]) =>
      request<ExamResult>("POST", `/Exam/${examId}/Submit`, { answers }),
  },
  student: {
    me: () => request<User>("GET", "/Student/Me"),
    myCourses: () => request<Course[]>("GET", "/Student/Me/Courses"),
    updateProfile: (data: Partial<User>) => request<User>("PUT", "/Student/Me", data),
  },
};
