import AsyncStorage from "@react-native-async-storage/async-storage";
import APP_CONFIG from "@/constants/config";
export interface ReponseResult<T> {
  error: { code: string; description: string; message: string };
  isFailure: boolean;
  isSuccess: boolean;
  value: T;
}

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
  expired: string; // ISO Date string (e.g., "2027-06-07T16:24:58Z")
  fullName: string;
  isEnabledCenterModule: boolean;
  isEnabledCourseModule: boolean;
  isEnabledExamModule: boolean;
  isEnabledTrackModule: boolean;
  isHaveMultipleTeachersForCourses: boolean;
  roles: string[] | null; // Assuming roles would be an array of strings if populated
  studentGrade: string;
  teacherName: string | null;
  tenantId: string; // UUID string
  token: string; // JWT Token string
  userId: string; // UUID string
  userName: string; // Phone number string
  userType: number;
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("auth_token");
}

async function buildHeaders(
  includeAuth = true,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    tenantId: APP_CONFIG.TENANT_ID,
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
  includeAuth = true,
): Promise<T> {
  const headers = await buildHeaders(includeAuth);
  const separator = path.includes("?") ? "&" : "?";
  const url = `${APP_CONFIG.API_BASE_URL}${path}${separator}tenantId=${encodeURIComponent(APP_CONFIG.TENANT_ID)}`;
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
    const envelope = data as ReponseResult<unknown>;
    const message =
      envelope?.error?.message ?? envelope?.error?.description ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  const envelope = data as ReponseResult<T>;
  if (envelope?.isFailure) {
    throw new Error(
      envelope.error?.message ?? envelope.error?.description ?? "Request failed",
    );
  }
  return envelope.value;
}

export const api = {
  auth: {
    login: (phone: string, password: string) =>
      request<LoginResponse>(
        "POST",
        "/auth/Login",
        { userName: phone, password },
        false,
      ),
  },
  teachers: {
    list: () => request<Teacher[]>("GET", "/student-ui/portal-teacher"),
  },
  courses: {
    list: (teacherId?: string) =>
      request<Course[]>(
        "GET",
        `/Course${teacherId ? `?teacherId=${teacherId}` : ""}`,
      ),
    get: (id: string) => request<Course>("GET", `/Course/${id}`),
    redeem: (courseId: string, code: string) =>
      request<{ success: boolean }>("POST", `/Course/${courseId}/Redeem`, {
        code,
      }),
    lessons: (courseId: string) =>
      request<Lesson[]>("GET", `/Course/${courseId}/Lessons`),
    exams: (courseId: string) =>
      request<Exam[]>("GET", `/Course/${courseId}/Exams`),
  },
  lessons: {
    get: (id: string) => request<Lesson>("GET", `/Lesson/${id}`),
  },
  exams: {
    get: (id: string) => request<Exam>("GET", `/Exam/${id}`),
    submit: (
      examId: string,
      answers: { questionId: string; selectedIndex: number }[],
    ) => request<ExamResult>("POST", `/Exam/${examId}/Submit`, { answers }),
  },
  student: {
    me: () => request<User>("GET", "/Student/Me"),
    myCourses: () => request<Course[]>("GET", "/Student/Me/Courses"),
    updateProfile: (data: Partial<User>) =>
      request<User>("PUT", "/Student/Me", data),
  },
};
