import AsyncStorage from "@react-native-async-storage/async-storage";
import APP_CONFIG from "@/constants/config";

// ─── Response wrapper ─────────────────────────────────────────────────────────
export interface ReponseResult<T> {
  error: { code: string; description: string; message: string };
  isFailure: boolean;
  isSuccess: boolean;
  value: T;
}

interface DataAndCount<T> {
  count: number;
  data: T[];
}

// ─── Raw API DTOs (match swagger exactly) ────────────────────────────────────
interface PortalTeacherDto {
  id: string;
  fullName: string;
  imageUrl?: string;
  phone?: string;
  whatsapp?: string;
  materialStudyName?: string;
  shortCode?: string;
}

interface CourseDto {
  id: string;
  title: string;
  about?: string;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  codePriceValue?: number;
  totalLessons?: number;
  totaExams?: number;
  mainTeacherName?: string;
  mainTeacherId?: string;
  portalTeacherId?: string;
  portalTeacherName?: string;
  studentGradeName?: string;
  materialStudyName?: string;
  courseStatusName?: string;
}

interface CourseLessonDto {
  id: string;
  index?: number;
  title: string;
  description?: string;
  fileUrl?: string;
  embededUrl?: string;
  previewUrl?: string;
  totalHours?: number;
  totalMinutes?: number;
  courseLessonType?: number;
  courseLessonTypeName?: string;
  examId?: string;
  isNotShowUntilExamPass?: boolean;
}

interface CourseWithDetailsDto {
  isAllowed: boolean;
  course: CourseDto;
  courseTopics?: unknown[];
}

// ─── App-level types (used by all screens) ───────────────────────────────────
export interface Teacher {
  id: string;
  name: string;
  image?: string;
  subject?: string;
  phone?: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  image?: string;
  introVideoUrl?: string;
  price?: number;
  lessonsCount?: number;
  examsCount?: number;
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
  fileUrl?: string;
  embededUrl?: string;
  videoUrl?: string;
  isLocked?: boolean;
  order?: number;
  description?: string;
  type?: number;
  typeName?: string;
  examId?: string;
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
  expired: string;
  fullName: string;
  isEnabledCenterModule: boolean;
  isEnabledCourseModule: boolean;
  isEnabledExamModule: boolean;
  isEnabledTrackModule: boolean;
  isHaveMultipleTeachersForCourses: boolean;
  roles: string[] | null;
  studentGrade: string;
  teacherName: string | null;
  tenantId: string;
  token: string;
  userId: string;
  userName: string;
  userType: number;
}

// ─── Mappers (DTO → app type) ─────────────────────────────────────────────────
function mapTeacher(dto: PortalTeacherDto): Teacher {
  return {
    id: dto.id,
    name: dto.fullName,
    image: dto.imageUrl,
    subject: dto.materialStudyName,
    phone: dto.phone,
  };
}

function mapCourse(dto: CourseDto, isAllowed?: boolean): Course {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.about,
    image: dto.thumbnailUrl,
    introVideoUrl: dto.introVideoUrl,
    price: dto.codePriceValue,
    lessonsCount: dto.totalLessons,
    examsCount: dto.totaExams,
    teacherName: dto.mainTeacherName ?? dto.portalTeacherName,
    teacherId: dto.mainTeacherId ?? dto.portalTeacherId,
    isPurchased: isAllowed,
    grade: dto.studentGradeName,
    subject: dto.materialStudyName,
  };
}

function mapLesson(dto: CourseLessonDto): Lesson {
  const durationMinutes =
    (dto.totalHours ?? 0) * 60 + (dto.totalMinutes ?? 0);
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    fileUrl: dto.fileUrl,
    embededUrl: dto.embededUrl,
    videoUrl: dto.fileUrl ?? dto.embededUrl,
    order: dto.index,
    duration: durationMinutes || undefined,
    type: dto.courseLessonType,
    typeName: dto.courseLessonTypeName,
    examId: dto.examId,
  };
}

// ─── HTTP core ────────────────────────────────────────────────────────────────
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
      envelope?.error?.message ??
      envelope?.error?.description ??
      `HTTP ${res.status}`;
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

// ─── API ──────────────────────────────────────────────────────────────────────
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
    // GET /student-ui/portal-teacher → Result<PortalTeacherDto[]>
    list: async (): Promise<Teacher[]> => {
      const dtos = await request<PortalTeacherDto[]>(
        "GET",
        "/student-ui/portal-teacher",
      );
      return (dtos ?? []).map(mapTeacher);
    },
  },

  courses: {
    // POST /student-ui/courses/list → Result<DataAndCount<CourseDto>>
    list: async (portalTeacherId?: string): Promise<Course[]> => {
      const result = await request<DataAndCount<CourseDto>>(
        "POST",
        "/student-ui/courses/list",
        { skip: 0, take: 100, portalTeacherId: portalTeacherId || undefined },
      );
      return (result?.data ?? []).map((dto) => mapCourse(dto));
    },

    // GET /student-ui/courses/{id} → Result<CourseWithDetailsDto>
    get: async (id: string): Promise<Course> => {
      const result = await request<CourseWithDetailsDto>(
        "GET",
        `/student-ui/courses/${id}`,
      );
      return mapCourse(result.course, result.isAllowed);
    },

    // POST /student-ui/lessons/list → Result<CourseLessonDto[]>
    lessons: async (courseId: string): Promise<Lesson[]> => {
      const dtos = await request<CourseLessonDto[]>(
        "POST",
        "/student-ui/lessons/list",
        { courseId, skip: 0, take: 200 },
      );
      return (dtos ?? []).map(mapLesson);
    },

    // POST /student-ui/courses/allowed → Result<DataAndCount<CourseDto>>
    allowed: async (): Promise<Course[]> => {
      const result = await request<DataAndCount<CourseDto>>(
        "POST",
        "/student-ui/courses/allowed",
        { skip: 0, take: 100 },
      );
      return (result?.data ?? []).map((dto) => mapCourse(dto, true));
    },

    // POST /student-ui/course-enrollments → enroll with access code
    enroll: (courseId: string, code: string) =>
      request<{ id?: string }>("POST", "/student-ui/course-enrollments", {
        courseId,
        code,
      }),

    // kept as alias so existing screens using redeem() still work
    redeem: (courseId: string, code: string) =>
      request<{ id?: string }>("POST", "/student-ui/course-enrollments", {
        courseId,
        code,
      }),

    // GET /student-ui/courses/Allowed/{id} → check if student has access
    checkAllowed: (id: string) =>
      request<{ codeId: string; isAllowed: boolean }>(
        "GET",
        `/student-ui/courses/Allowed/${id}`,
      ),

    // Exams come from lessons (CourseLessonDto.examId != null)
    exams: async (courseId: string): Promise<Exam[]> => {
      const lessons = await api.courses.lessons(courseId);
      return lessons
        .filter((l) => l.examId)
        .map((l) => ({
          id: l.examId!,
          title: l.title,
          courseId,
        }));
    },
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
    // My courses = allowed courses
    myCourses: async (): Promise<Course[]> => {
      const result = await request<DataAndCount<CourseDto>>(
        "POST",
        "/student-ui/courses/allowed",
        { skip: 0, take: 100 },
      );
      return (result?.data ?? []).map((dto) => mapCourse(dto, true));
    },
    updateProfile: (data: Partial<User>) =>
      request<User>("PUT", "/Student/Me", data),
  },
};
