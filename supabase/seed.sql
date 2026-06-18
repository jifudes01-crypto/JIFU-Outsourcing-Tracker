insert into public.vendors (vendor_name, contact_person, phone, email, address, note)
values
  ('宏達印刷有限公司','陳先生','02-2750-8800','print@example.com','台北市信義區','長期配合'),
  ('晴川輸出中心','林小姐','02-2751-8811','output@example.com','台北市大安區','急件可配合'),
  ('藍點設計工作室','王先生','02-2752-8822','design@example.com','新北市板橋區',null),
  ('光影攝影棚','張小姐','02-2753-8833','photo@example.com','台北市中山區',null),
  ('城市廣告工程','李先生','02-2754-8844','ads@example.com','新北市三重區','招牌施工'),
  ('永信耗材行','黃小姐','02-2755-8855','supply@example.com','台北市內湖區',null),
  ('大禾招牌','劉先生','02-2756-8866','sign@example.com','桃園市龜山區',null),
  ('品捷貼紙工坊','蔡小姐','02-2757-8877','sticker@example.com','新北市中和區',null)
on conflict (vendor_name) do nothing;

do $$
declare
  vendor_ids uuid[];
  cat_names text[] := array['印刷','輸出','設計','攝影','廣告','耗材','其他'];
  i int;
begin
  select array_agg(id order by vendor_name) into vendor_ids from public.vendors;
  for i in 1..30 loop
    insert into public.outsource_orders (
      order_date, vendor_id, vendor_name, requester, creator_name, item_name, category,
      quantity, unit_price, total_price, status, payment_status, payment_date, payment_method,
      payment_note, invoice_file_url, invoice_file_name, remittance_file_url, remittance_file_name, note
    )
    select
      date '2026-01-01' + (i || ' days')::interval,
      v.id,
      v.vendor_name,
      (array['業務部','行政部','總務部','行銷部'])[1 + (i % 4)],
      (array['林怡君','陳冠廷','王雅婷','黃柏翰','李佳蓉'])[1 + (i % 5)],
      (array['名片印刷','DM 輸出','活動背板','形象照拍攝','招牌製作','貼紙印刷'])[1 + (i % 6)],
      cat_names[1 + (i % 7)],
      1 + (i % 5),
      1200 + i * 350,
      (1 + (i % 5)) * (1200 + i * 350),
      (array['發包中','製作中','已完成','取消'])[1 + (i % 4)],
      (array['未付款','已付款','部分付款','不需付款'])[1 + (i % 4)],
      case when i % 3 <> 0 then date '2026-01-03' + (i || ' days')::interval else null end,
      case when i % 3 <> 0 then (array['現金','匯款','支票','信用卡'])[1 + (i % 4)] else null end,
      case when i % 3 <> 0 then '已完成付款確認' else '等待請款' end,
      case when i % 4 = 0 then 'https://example.com/invoice.pdf' else null end,
      case when i % 4 = 0 then 'invoice-' || i || '.pdf' else null end,
      case when i % 5 = 0 then 'https://example.com/remittance.pdf' else null end,
      case when i % 5 = 0 then 'remittance-' || i || '.pdf' else null end,
      'Seed mock data'
    from public.vendors v
    where v.id = vendor_ids[1 + (i % array_length(vendor_ids, 1))];
  end loop;
end $$;
