"""API xác thực và quản lý tài khoản người dùng."""

from django.contrib.auth import get_user_model

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiExample

from rest_framework import status

from rest_framework.response import Response

from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework_simplejwt.views import (

    TokenObtainPairView,

    TokenRefreshView,

    TokenVerifyView,

)

from rest_framework.permissions import AllowAny, IsAuthenticated

from rest_framework.parsers import FormParser, MultiPartParser



from common.openapi import (

    AvatarUploadForm,

    LoginRequestSerializer,

    MessageResponseSerializer,

    RegisterResponseSerializer,

    TokenPairResponseSerializer,

    TokenRefreshRequestSerializer,

    TokenVerifyRequestSerializer,

)
from common.avatar import clear_account_avatar, save_account_avatar
from common.openapi_files import MULTIPART_FILE_UPLOAD_NOTE, multipart_request

from .serializers import (

    CustomTokenObtainPairSerializer,

    LoginResponseSerializer,

    RegisterSerializer,

    ProfileSerializer,

    ChangePasswordSerializer,

    LogoutSerializer,

    AvatarUploadSerializer,

)



Account = get_user_model()



REGISTER_EXAMPLE = OpenApiExample(

    "Đăng ký Supplier",

    value={

        "username": "supplier01",

        "email": "supplier01@example.com",

        "password": "12345678",

        "repassword": "12345678",

        "full_name": "Nguyen Van A",

        "phone": "0901234567",

        "role": "supplier",

    },

    request_only=True,

)





@extend_schema_view(

    post=extend_schema(

        tags=["Auth"],

        summary="Đăng ký tài khoản",

        description=(

            "Tạo tài khoản mới và **trả JWT ngay** — dùng cho luồng onboarding 2 bước.\n\n"

            "**Quy tắc status:**\n"

            "- `buyer` → `active` (dùng ngay)\n"

            "- `supplier` / `dealer` → `pending` (chờ duyệt hồ sơ)\n\n"

            "**Luồng Supplier:** Sau khi đăng ký, lưu `access` token và chuyển sang "

            "tạo profile (`POST /api/suppliers/`) + upload giấy tờ — **không cần gọi login**."

        ),

        request=RegisterSerializer,

        responses={201: RegisterResponseSerializer},

        examples=[REGISTER_EXAMPLE],

        auth=[],

    )

)

class RegisterView(APIView):
    """Endpoint đăng ký tài khoản mới và trả JWT ngay sau khi tạo."""

    permission_classes = [AllowAny]



    def post(self, request):
        """Xử lý yêu cầu đăng ký, tạo tài khoản và trả cặp token JWT."""
        serializer = RegisterSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)



        account = serializer.save()

        refresh = RefreshToken.for_user(account)

        return Response(

            {

                "message": "Register successfully",

                "account_id": account.id,

                "access": str(refresh.access_token),

                "refresh": str(refresh),

            },

            status=status.HTTP_201_CREATED,

        )





@extend_schema_view(

    post=extend_schema(

        tags=["Auth"],

        summary="Đăng nhập",

        description=(

            "Xác thực bằng username + password, trả JWT và dữ liệu user đầy đủ.\n\n"

            "- `account`: thông tin tài khoản (id, username, email, role, status, ...)\n"

            "- `supplier_profile`: hồ sơ NCC + `documents[]` (null nếu chưa có)\n\n"

            "Access token hết hạn sau **2 giờ**. Dùng `/api/refresh/` để lấy access mới."

        ),

        request=LoginRequestSerializer,

        responses={200: LoginResponseSerializer},

        examples=[

            OpenApiExample(

                "Đăng nhập",

                value={"username": "supplier01", "password": "12345678"},

                request_only=True,

            )

        ],

        auth=[],

    )

)

class LoginView(TokenObtainPairView):
    """Endpoint đăng nhập bằng username và mật khẩu, trả JWT kèm thông tin user."""

    serializer_class = CustomTokenObtainPairSerializer

    permission_classes = [AllowAny]





@extend_schema_view(

    post=extend_schema(

        tags=["Auth"],

        summary="Làm mới access token",

        description=(

            "Gửi refresh token hợp lệ để nhận access token mới. "

            "Refresh token cũ sẽ bị blacklist nếu bật ROTATE_REFRESH_TOKENS."

        ),

        request=TokenRefreshRequestSerializer,

        responses={200: TokenPairResponseSerializer},

        auth=[],

    )

)

class RefreshView(TokenRefreshView):
    """Endpoint làm mới access token từ refresh token hợp lệ."""

    pass





@extend_schema_view(

    post=extend_schema(

        tags=["Auth"],

        summary="Kiểm tra token",

        description="Xác minh access hoặc refresh token còn hợp lệ. Trả 200 nếu OK, 401 nếu hết hạn/không hợp lệ.",

        request=TokenVerifyRequestSerializer,

        responses={200: None},

        auth=[],

    )

)

class VerifyView(TokenVerifyView):
    """Endpoint kiểm tra access hoặc refresh token còn hợp lệ hay không."""

    pass




class LogoutView(APIView):
    """Endpoint đăng xuất bằng cách blacklist refresh token."""



    @extend_schema(

        tags=["Auth"],

        summary="Đăng xuất",

        description="Blacklist refresh token. Access token hiện tại vẫn hết hạn tự nhiên sau 2 giờ.",

        request=LogoutSerializer,

        responses={200: MessageResponseSerializer, 400: MessageResponseSerializer},

    )

    def post(self, request):
        """Blacklist refresh token được gửi lên để kết thúc phiên đăng nhập."""
        serializer = LogoutSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)



        try:

            RefreshToken(

                serializer.validated_data["refresh"]

            ).blacklist()

        except Exception:

            return Response(

                {"detail": "Invalid refresh token"},

                status=status.HTTP_400_BAD_REQUEST,

            )



        return Response(

            {"detail": "Logout successful"},

            status=status.HTTP_200_OK,

        )





@extend_schema_view(

    get=extend_schema(

        tags=["Auth"],

        summary="Xem thông tin cá nhân",

        description="Lấy profile của user đang đăng nhập (theo JWT).",

        responses={200: ProfileSerializer},

    ),

    put=extend_schema(

        tags=["Auth"],

        summary="Cập nhật thông tin cá nhân",

        description="Cập nhật một phần hoặc toàn bộ thông tin profile. Gửi field cần đổi.",

        request=ProfileSerializer,

        responses={200: ProfileSerializer},

    ),

)

class ProfileView(APIView):
    """Endpoint xem và cập nhật thông tin cá nhân của user đang đăng nhập."""



    def get(self, request):
        """Lấy profile đầy đủ của user hiện tại."""
        serializer = ProfileSerializer(request.user, context={"request": request})

        return Response(serializer.data)



    def put(self, request):
        """Cập nhật một phần thông tin profile của user hiện tại."""
        serializer = ProfileSerializer(

            request.user,

            data=request.data,

            partial=True,
            context={"request": request},

        )

        serializer.is_valid(raise_exception=True)

        user = serializer.save()
        user = Account.objects.get(pk=user.pk)

        return Response(ProfileSerializer(user, context={"request": request}).data)





@extend_schema_view(

    post=extend_schema(

        tags=["Auth"],

        summary="Đổi mật khẩu",

        description="Yêu cầu mật khẩu cũ đúng. User phải đã đăng nhập.",

        request=ChangePasswordSerializer,

        responses={200: MessageResponseSerializer, 400: MessageResponseSerializer},

    )

)

class ChangePasswordView(APIView):
    """Endpoint đổi mật khẩu cho user đã đăng nhập."""



    def post(self, request):
        """Xác thực mật khẩu cũ và lưu mật khẩu mới cho user hiện tại."""
        serializer = ChangePasswordSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)



        if not request.user.check_password(

            serializer.validated_data["old_password"]

        ):

            return Response(

                {"detail": "Old password is incorrect"},

                status=status.HTTP_400_BAD_REQUEST,

            )



        request.user.set_password(

            serializer.validated_data["new_password"]

        )

        request.user.save()



        return Response({"detail": "Password changed successfully"})


@extend_schema_view(
    post=extend_schema(
        tags=["Auth"],
        summary="Upload / cập nhật avatar",
        description=(
            f"{MULTIPART_FILE_UPLOAD_NOTE}\n\n"
            "Upload ảnh đại diện (field `avatar`).\n"
            "Định dạng: jpg, png, webp — tối đa 5MB.\n"
            "Thay avatar mới sẽ xóa file cũ trên server."
        ),
        request=multipart_request(AvatarUploadForm),
        responses={200: ProfileSerializer},
    ),
    delete=extend_schema(
        tags=["Auth"],
        summary="Xóa avatar",
        description="Gỡ ảnh đại diện hiện tại của user đăng nhập.",
        responses={200: ProfileSerializer},
    ),
)
class AvatarView(APIView):
    """Endpoint upload hoặc xóa ảnh đại diện của user đang đăng nhập."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        """Upload ảnh đại diện mới, thay thế file cũ nếu đã tồn tại."""
        serializer = AvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = save_account_avatar(
            request.user,
            serializer.validated_data["avatar"],
        )
        return Response(
            ProfileSerializer(user, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        """Xóa ảnh đại diện hiện tại của user đang đăng nhập."""
        user = clear_account_avatar(request.user)
        return Response(
            ProfileSerializer(user, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )
