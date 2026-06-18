"""API đăng ký / đăng nhập buyer trên gian hàng đại lý."""

from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .storefront_serializers import (
    StorefrontAuthResponseSerializer,
    StorefrontLoginSerializer,
    StorefrontRegisterSerializer,
    build_storefront_auth_response,
)

STOREFRONT_REGISTER_EXAMPLE = OpenApiExample(
    "Đăng ký buyer tại gian hàng",
    value={
        "email": "buyer@gmail.com",
        "password": "12345678",
        "repassword": "12345678",
        "full_name": "Nguyen Van A",
        "phone": "0901234567",
    },
    request_only=True,
)

STOREFRONT_LOGIN_EXAMPLE = OpenApiExample(
    "Đăng nhập buyer tại gian hàng",
    value={
        "email": "buyer@gmail.com",
        "password": "12345678",
    },
    request_only=True,
)


class StorefrontRegisterView(APIView):
    """Đăng ký tài khoản buyer riêng cho từng gian hàng đại lý."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Storefront Auth"],
        summary="Đăng ký buyer tại gian hàng đại lý",
        description=(
            "Mỗi đại lý có tệp buyer riêng. Cùng email có thể đăng ký lại tại đại lý khác.\n\n"
            "Trả JWT kèm claim `store_dealer_id`, `store_dealer_slug`, `auth_scope=storefront`."
        ),
        request=StorefrontRegisterSerializer,
        responses={201: StorefrontAuthResponseSerializer},
        examples=[STOREFRONT_REGISTER_EXAMPLE],
        auth=[],
    )
    def post(self, request, dealer_slug):
        serializer = StorefrontRegisterSerializer(
            data=request.data,
            context={"dealer_slug": dealer_slug, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        account = serializer.save()
        return Response(
            build_storefront_auth_response(account, request),
            status=status.HTTP_201_CREATED,
        )


class StorefrontLoginView(APIView):
    """Đăng nhập buyer theo email trong phạm vi một gian hàng đại lý."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Storefront Auth"],
        summary="Đăng nhập buyer tại gian hàng đại lý",
        description=(
            "Chỉ tài khoản đã đăng ký tại **đúng** đại lý mới đăng nhập được. "
            "Token đại lý A không dùng được tại đại lý B."
        ),
        request=StorefrontLoginSerializer,
        responses={200: StorefrontAuthResponseSerializer},
        examples=[STOREFRONT_LOGIN_EXAMPLE],
        auth=[],
    )
    def post(self, request, dealer_slug):
        serializer = StorefrontLoginSerializer(
            data=request.data,
            context={"dealer_slug": dealer_slug, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        account = serializer.save()
        return Response(build_storefront_auth_response(account, request))
