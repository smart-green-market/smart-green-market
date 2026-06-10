"""Chuyển dữ liệu từ supplier_document sang account_documents."""

from django.db import migrations


def copy_supplier_documents(apps, schema_editor):
    SupplierDocument = apps.get_model("suppliers", "SupplierDocument")
    AccountDocument = apps.get_model("accounts", "AccountDocument")
    Supplier = apps.get_model("suppliers", "Supplier")

    for doc in SupplierDocument.objects.all().iterator():
        supplier = Supplier.objects.get(pk=doc.supplier_id)
        account_doc = AccountDocument(
            id=doc.id,
            account_id=supplier.account_id,
            document_type=doc.document_type,
            file_url=doc.file_url,
            status=doc.status,
            verified_by_id=doc.verified_by_id,
            verified_at=doc.verified_at,
        )
        account_doc.save()
        AccountDocument.objects.filter(pk=account_doc.pk).update(created_at=doc.created_at)

    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(
            "SELECT setval(pg_get_serial_sequence('account_documents', 'id'), "
            "COALESCE((SELECT MAX(id) FROM account_documents), 1));"
        )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_accountdocument"),
        ("suppliers", "0004_alter_supplier_options_and_more"),
    ]

    operations = [
        migrations.RunPython(copy_supplier_documents, migrations.RunPython.noop),
    ]
